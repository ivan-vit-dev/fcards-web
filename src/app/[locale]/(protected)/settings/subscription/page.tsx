"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, CreditCard, Gift, Loader2, Star, Zap } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/authStore";
import { createCheckoutSession, createPortalSession, getUserDoc } from "@/lib/firebaseServices";
import { ACTIVE_SUBSCRIPTION_STATUSES, FREE_MODE_AI_CREDITS, isPaidMode } from "@/lib/billing";
import { OPERATOR } from "@/lib/legal";
import {
  TIER_LIMITS,
  TIER_LABELS,
  TIER_PRICES_CZK,
  TIER_PRICES_YEARLY_CZK,
  getAICreditsLeft,
} from "@/lib/subscriptionEngine";
import { cn } from "@/lib/utils";
import type { BillingInterval, SubscriptionTier } from "@/types";

const TIERS: SubscriptionTier[] = ["free", "premium", "team", "club"];

const unlimited = (v: number) => (v === -1 ? "Neomezeno" : String(v));
const yesNo = (v: boolean) => (v ? "✓" : "—");

const FEATURE_ROWS: { label: string; getValue: (t: SubscriptionTier) => string }[] = [
  { label: "Kartičky / měs.", getValue: (t) => unlimited(TIER_LIMITS[t].cardsPerMonth) },
  { label: "AI kredity / měs.", getValue: (t) => unlimited(TIER_LIMITS[t].aiCreditsPerMonth) },
  { label: "Tisk karet", getValue: (t) => yesNo(TIER_LIMITS[t].canPrint) },
  { label: "Prémiové designy a AI", getValue: (t) => yesNo(TIER_LIMITS[t].premiumAIStyles) },
  { label: "Vlastní branding", getValue: (t) => yesNo(TIER_LIMITS[t].customBranding) },
  { label: "Max. hráčů", getValue: (t) => unlimited(TIER_LIMITS[t].maxPlayers) },
  { label: "Max. týmů", getValue: (t) => unlimited(TIER_LIMITS[t].maxTeams) },
];

const STATUS_LABELS: Record<string, string> = {
  active: "Aktivní",
  trialing: "Zkušební období",
  past_due: "Platba se nezdařila",
  canceled: "Zrušeno",
  unpaid: "Nezaplaceno",
  incomplete: "Čeká na platbu",
  incomplete_expired: "Platba vypršela",
  paused: "Pozastaveno",
};

const formatDate = (ms: number) => new Date(ms).toLocaleDateString("cs-CZ");

function valueClass(val: string) {
  return val === "—"
    ? "text-muted-foreground/40"
    : val === "✓"
      ? "text-green-600 dark:text-green-400 font-bold"
      : "font-semibold";
}

// ─── Free mode ────────────────────────────────────────────────────────────────

function FreeModePage() {
  const { user } = useAuthStore();
  const left = getAICreditsLeft(user);
  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-display font-bold">Předplatné</h1>
      <div className="flex gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-5">
        <Gift className="h-6 w-6 shrink-0 text-primary" />
        <div className="space-y-2">
          <p className="font-semibold">Fotbalové Kartičky jsou teď zdarma</p>
          <p className="text-sm text-muted-foreground">
            Všechny funkce jsou odemčené: neomezené kartičky, všechny designy, tisk, týmy i hráči. AI úpravy
            fotek mají limit {FREE_MODE_AI_CREDITS} za měsíc, protože každá stojí peníze za výpočetní výkon.
          </p>
          {left !== null && (
            <p className="text-sm">
              Tento měsíc vám zbývá <strong>{left}</strong> AI úprav.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Paid mode ────────────────────────────────────────────────────────────────

function PaidModePage() {
  const { user, setUser } = useAuthStore();
  const locale = (useParams()?.locale as string) ?? "cs";
  const router = useRouter();
  const searchParams = useSearchParams();
  const [interval, setBillingInterval] = useState<BillingInterval>("month");
  const [busy, setBusy] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);
  const handled = useRef(false);

  const sub = user?.subscription;
  const hasActiveSub = !!sub && ACTIVE_SUBSCRIPTION_STATUSES.includes(sub.status);
  const currentTier = user?.subscriptionTier ?? "free";
  const periodEnd = sub?.currentPeriodEnd?.toMillis?.();

  // Back from Stripe Checkout: the webhook activates the plan within seconds — poll until it does.
  useEffect(() => {
    const result = searchParams.get("checkout");
    if (!result || handled.current || !user) return;
    handled.current = true;
    router.replace(`/${locale}/settings/subscription`);
    if (result === "cancel") {
      toast("Platba byla zrušena, nic jsme nestrhli.", { icon: "↩️" });
      return;
    }
    let cancelled = false;
    (async () => {
      setActivating(true);
      for (let i = 0; i < 15 && !cancelled; i++) {
        const fresh = await getUserDoc(user.uid).catch(() => null);
        if (fresh && fresh.subscriptionTier !== "free") {
          setUser(fresh);
          toast.success(`Děkujeme! Plán ${TIER_LABELS[fresh.subscriptionTier]} je aktivní.`);
          setActivating(false);
          return;
        }
        await new Promise((r) => setTimeout(r, 2000));
      }
      if (!cancelled) {
        setActivating(false);
        toast("Platba proběhla, aktivace ještě chvíli trvá. Obnovte stránku za minutu.", { icon: "⏳" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams, user, locale, router, setUser]);

  const checkout = async (tier: "premium" | "team") => {
    setBusy(tier);
    try {
      window.location.assign(await createCheckoutSession(tier, interval, locale));
    } catch (err) {
      const code = (err as { code?: string }).code;
      console.warn("[Subscription] checkout", err);
      toast.error(
        code === "functions/already-exists"
          ? "Předplatné už máte – plán změníte ve správě předplatného."
          : "Platbu se nepodařilo zahájit. Zkuste to prosím znovu."
      );
      setBusy(null);
    }
  };

  const portal = async () => {
    setBusy("portal");
    try {
      window.location.assign(await createPortalSession(locale));
    } catch (err) {
      console.warn("[Subscription] portal", err);
      toast.error("Správu předplatného se nepodařilo otevřít.");
      setBusy(null);
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold">Předplatné</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Aktuální plán: <span className="font-semibold text-foreground">{TIER_LABELS[currentTier]}</span>
        </p>
      </div>

      {activating && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Aktivujeme váš plán…
        </div>
      )}

      {/* Current subscription */}
      {sub && hasActiveSub && (
        <div
          className={cn(
            "flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border",
            sub.status === "past_due" ? "border-destructive/40 bg-destructive/5" : "border-primary/20 bg-primary/10"
          )}
        >
          {sub.status === "past_due" ? (
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
          ) : (
            <Star className="h-5 w-5 text-primary shrink-0" />
          )}
          <div className="flex-1 text-sm">
            <p className="font-semibold">
              {TIER_LABELS[currentTier]} · {sub.interval === "year" ? "ročně" : "měsíčně"} ·{" "}
              {STATUS_LABELS[sub.status] ?? sub.status}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {sub.status === "past_due"
                ? "Poslední platba neprošla. Aktualizujte platební kartu, jinak se plán zruší."
                : periodEnd
                  ? sub.cancelAtPeriodEnd
                    ? `Předplatné skončí ${formatDate(periodEnd)} a dál se nebude obnovovat.`
                    : `Další platba ${formatDate(periodEnd)}.`
                  : null}
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={portal} disabled={busy !== null}>
            <CreditCard className="h-3.5 w-3.5" />
            {busy === "portal" ? "Otevírám…" : "Spravovat předplatné"}
          </Button>
        </div>
      )}

      {/* Interval toggle */}
      {!hasActiveSub && (
        <div className="inline-flex rounded-full border border-border p-1">
          {(
            [
              ["month", "Měsíčně"],
              ["year", "Ročně · 2 měsíce zdarma"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setBillingInterval(id)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                interval === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Plans */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {TIERS.map((tier) => {
          const price = (interval === "year" ? TIER_PRICES_YEARLY_CZK : TIER_PRICES_CZK)[tier];
          const isCurrent = tier === currentTier;
          const isPopular = tier === "premium";
          return (
            <div
              key={tier}
              className={cn(
                "relative flex flex-col rounded-2xl border p-5 gap-4",
                isCurrent ? "border-primary bg-primary/5" : isPopular ? "border-primary/40 bg-card shadow-sm" : "border-border bg-card"
              )}
            >
              {isPopular && !isCurrent && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground whitespace-nowrap">
                  <Zap className="h-2.5 w-2.5" /> Nejoblíbenější
                </span>
              )}
              {isCurrent && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px]">Váš plán</Badge>
              )}

              <div>
                <p className="font-display font-bold">{TIER_LABELS[tier]}</p>
                <p className="text-2xl font-display font-bold mt-1.5">
                  {price === null ? (
                    <span className="text-base font-sans font-normal text-muted-foreground">Na dotaz</span>
                  ) : price === 0 ? (
                    "Zdarma"
                  ) : (
                    <>
                      {price.toLocaleString("cs-CZ")} Kč
                      <span className="text-sm font-sans font-normal text-muted-foreground">
                        {interval === "year" ? " /rok" : " /měs"}
                      </span>
                    </>
                  )}
                </p>
              </div>

              <ul className="space-y-1.5 flex-1">
                {FEATURE_ROWS.map((row) => {
                  const val = row.getValue(tier);
                  return (
                    <li key={row.label} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className={valueClass(val)}>{val}</span>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-auto">
                {isCurrent ? (
                  <Button variant="outline" className="w-full" disabled>
                    Aktuální plán
                  </Button>
                ) : tier === "free" ? (
                  hasActiveSub ? (
                    <Button variant="ghost" className="w-full" onClick={portal} disabled={busy !== null}>
                      Zrušit předplatné
                    </Button>
                  ) : null
                ) : tier === "club" ? (
                  <a href={`mailto:${OPERATOR.email}?subject=Plán Klub`}>
                    <Button variant="outline" className="w-full">
                      Kontaktujte nás
                    </Button>
                  </a>
                ) : hasActiveSub ? (
                  <Button variant="outline" className="w-full" onClick={portal} disabled={busy !== null}>
                    Změnit na {TIER_LABELS[tier]}
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={isPopular ? "default" : "outline"}
                    onClick={() => checkout(tier as "premium" | "team")}
                    disabled={busy !== null}
                  >
                    {busy === tier ? "Přesměrovávám…" : `Vybrat ${TIER_LABELS[tier]}`}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground pb-4 space-y-1">
        Platby zpracovává Stripe, údaje o kartě k nám nikdy nedorazí. Předplatné se automaticky obnovuje a lze ho
        kdykoli zrušit ve správě předplatného – platí pak do konce zaplaceného období.
        <br />
        Máte otázky? Napište nám na{" "}
        <a href={`mailto:${OPERATOR.email}`} className="text-primary hover:underline">
          {OPERATOR.email}
        </a>
      </p>
    </div>
  );
}

export default function SubscriptionPage() {
  if (!isPaidMode()) return <FreeModePage />;
  return (
    <Suspense>
      <PaidModePage />
    </Suspense>
  );
}
