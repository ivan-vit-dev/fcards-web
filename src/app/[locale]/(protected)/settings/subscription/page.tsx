"use client";

import { useState } from "react";
import { Zap, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/authStore";
import {
  TIER_LIMITS,
  TIER_LABELS,
  TIER_PRICES_CZK,
} from "@/lib/subscriptionEngine";
import type { SubscriptionTier } from "@/types";
import toast from "react-hot-toast";

const TIERS: SubscriptionTier[] = ["free", "premium", "team", "club"];

const FEATURE_ROWS = [
  {
    label: "Kartičky / měs.",
    getValue: (t: SubscriptionTier) => {
      const v = TIER_LIMITS[t].cardsPerMonth;
      return v === -1 ? "Neomezeno" : String(v);
    },
  },
  {
    label: "AI kredity / měs.",
    getValue: (t: SubscriptionTier) => {
      const v = TIER_LIMITS[t].aiCreditsPerMonth;
      return v === -1 ? "Neomezeno" : String(v);
    },
  },
  {
    label: "Tisk karet",
    getValue: (t: SubscriptionTier) => TIER_LIMITS[t].canPrint ? "✓" : "—",
  },
  {
    label: "Prémiové AI styly",
    getValue: (t: SubscriptionTier) => TIER_LIMITS[t].premiumAIStyles ? "✓" : "—",
  },
  {
    label: "Vlastní branding",
    getValue: (t: SubscriptionTier) => TIER_LIMITS[t].customBranding ? "✓" : "—",
  },
  {
    label: "Max. hráčů",
    getValue: (t: SubscriptionTier) => {
      const v = TIER_LIMITS[t].maxPlayers;
      return v === -1 ? "Neomezeno" : String(v);
    },
  },
  {
    label: "Max. týmů",
    getValue: (t: SubscriptionTier) => {
      const v = TIER_LIMITS[t].maxTeams;
      return v === -1 ? "Neomezeno" : String(v);
    },
  },
];

export default function SubscriptionPage() {
  const { user } = useAuthStore();
  const currentTier = user?.subscriptionTier ?? "free";
  const [upgrading, setUpgrading] = useState<SubscriptionTier | null>(null);

  const handleUpgrade = async (tier: SubscriptionTier) => {
    setUpgrading(tier);
    // Payment integration placeholder — show "coming soon" for now
    await new Promise((r) => setTimeout(r, 800));
    toast("Platby budou brzy dostupné. Kontaktujte nás na info@fotbalove-karticky.cz", {
      icon: "📧",
      duration: 5000,
    });
    setUpgrading(null);
  };

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold">Předplatné</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Aktuální plán:{" "}
          <span className="font-semibold text-foreground">{TIER_LABELS[currentTier]}</span>
        </p>
      </div>

      {/* Current plan banner */}
      {currentTier !== "free" && (
        <div className="flex items-center gap-3 p-4 bg-primary/10 border border-primary/20 rounded-xl">
          <Star className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Plán {TIER_LABELS[currentTier]} je aktivní</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pro změnu nebo zrušení předplatného nás kontaktujte.
            </p>
          </div>
        </div>
      )}

      {/* Tier cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {TIERS.map((tier) => {
          const price = TIER_PRICES_CZK[tier];
          const isCurrent = tier === currentTier;
          const isPopular = tier === "premium";

          return (
            <div
              key={tier}
              className={`relative flex flex-col rounded-2xl border p-5 gap-4 ${
                isCurrent
                  ? "border-primary bg-primary/5"
                  : isPopular
                  ? "border-primary/40 bg-card shadow-sm"
                  : "border-border bg-card"
              }`}
            >
              {isPopular && !isCurrent && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground whitespace-nowrap">
                  <Zap className="h-2.5 w-2.5" /> Nejoblíbenější
                </span>
              )}
              {isCurrent && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px]">
                  Váš plán
                </Badge>
              )}

              <div>
                <p className="font-display font-bold">{TIER_LABELS[tier]}</p>
                <p className="text-2xl font-display font-bold mt-1.5">
                  {price === null ? (
                    <span className="text-base font-sans font-normal text-muted-foreground">
                      Na dotaz
                    </span>
                  ) : price === 0 ? (
                    "Zdarma"
                  ) : (
                    <>
                      {price} Kč
                      <span className="text-sm font-sans font-normal text-muted-foreground"> /měs</span>
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
                      <span
                        className={
                          val === "—" ? "text-muted-foreground/40" :
                          val === "✓" ? "text-green-600 dark:text-green-400 font-bold" :
                          "font-semibold"
                        }
                      >
                        {val}
                      </span>
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
                  <Button variant="ghost" className="w-full" disabled>
                    Přejít na Free
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={isPopular ? "default" : "outline"}
                    onClick={() => handleUpgrade(tier)}
                    disabled={upgrading !== null}
                  >
                    {upgrading === tier ? (
                      "Zpracovávám…"
                    ) : price === null ? (
                      "Kontaktujte nás"
                    ) : (
                      `Vybrat ${TIER_LABELS[tier]}`
                    )}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature comparison table */}
      <div className="rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 bg-muted/30 border-b border-border">
          <p className="text-sm font-semibold">Porovnání funkcí</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-muted-foreground font-medium">Funkce</th>
                {TIERS.map((tier) => (
                  <th key={tier} className="p-4 text-center font-display font-bold">
                    <span className={tier === currentTier ? "text-primary" : ""}>
                      {TIER_LABELS[tier]}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURE_ROWS.map((row, i) => (
                <tr key={row.label} className={i % 2 === 0 ? "bg-muted/20" : ""}>
                  <td className="p-4 text-muted-foreground">{row.label}</td>
                  {TIERS.map((tier) => {
                    const val = row.getValue(tier);
                    return (
                      <td key={tier} className="p-4 text-center">
                        <span
                          className={
                            val === "—" ? "text-muted-foreground/30" :
                            val === "✓" ? "text-green-600 dark:text-green-400 font-bold" :
                            "font-semibold"
                          }
                        >
                          {val}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground pb-4">
        Máte otázky? Napište nám na{" "}
        <a href="mailto:info@fotbalove-karticky.cz" className="text-primary hover:underline">
          info@fotbalove-karticky.cz
        </a>
      </p>
    </div>
  );
}
