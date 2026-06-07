"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TIER_LABELS, TIER_PRICES_CZK } from "@/lib/subscriptionEngine";
import type { SubscriptionTier } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason?: string;
  currentTier?: SubscriptionTier;
}

const TIER_FEATURES: Record<Exclude<SubscriptionTier, "free">, string[]> = {
  premium: [
    "20 karet měsíčně",
    "20 AI kreditů měsíčně",
    "Tisk A4 archů (9 nebo 4 karty)",
    "Všechny AI styly (FIFA, Panini, Anime…)",
    "Neomezený počet hráčů",
    "3 týmy",
  ],
  team: [
    "50 karet měsíčně",
    "50 AI kreditů měsíčně",
    "Všechny tiskové formáty vč. nálepek a alba",
    "Všechny AI styly",
    "Vlastní branding",
    "Neomezené týmy a hráči",
  ],
  club: [
    "Neomezené kartičky a AI kredity",
    "Všechny tiskové formáty",
    "Vlastní branding klubu",
    "Správa více týmů",
    "Priority podpora",
    "Na míru dle potřeb klubu",
  ],
};

const HIGHLIGHTED_TIER: SubscriptionTier = "premium";

export function UpgradeDialog({ open, onOpenChange, reason, currentTier = "free" }: Props) {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) ?? "cs";

  const navigateTo = (path: string) => {
    onOpenChange(false);
    router.push(path);
  };

  const tiers: Exclude<SubscriptionTier, "free">[] = ["premium", "team", "club"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-display">
            <Zap className="h-5 w-5 text-primary" />
            Upgradujte svůj plán
          </DialogTitle>
          {reason && (
            <DialogDescription className="text-sm">{reason}</DialogDescription>
          )}
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
          {tiers.map((tier) => {
            const price = TIER_PRICES_CZK[tier];
            const isCurrent = tier === currentTier;
            const isHighlighted = tier === HIGHLIGHTED_TIER;
            const features = TIER_FEATURES[tier];

            return (
              <div
                key={tier}
                className={`relative flex flex-col rounded-2xl border p-4 gap-3 ${
                  isHighlighted
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-card"
                }`}
              >
                {isHighlighted && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold px-3 py-0.5 rounded-full bg-primary text-primary-foreground whitespace-nowrap">
                    Nejoblíbenější
                  </span>
                )}

                <div>
                  <p className="font-display font-bold text-base">{TIER_LABELS[tier]}</p>
                  <p className="text-2xl font-display font-bold mt-1">
                    {price === null ? (
                      <span className="text-lg">Na dotaz</span>
                    ) : (
                      <>
                        {price} Kč
                        <span className="text-sm font-sans font-normal text-muted-foreground"> /měs</span>
                      </>
                    )}
                  </p>
                </div>

                <ul className="space-y-1.5 flex-1">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-xs">
                      <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-2">
                  {isCurrent ? (
                    <Button variant="outline" className="w-full" disabled>
                      Aktuální plán
                    </Button>
                  ) : price === null ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigateTo(`/${locale}/settings/subscription`)}
                    >
                      Kontaktujte nás
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      variant={isHighlighted ? "default" : "outline"}
                      onClick={() => navigateTo(`/${locale}/settings/subscription`)}
                    >
                      Vybrat {TIER_LABELS[tier]}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-1">
          Všechny plány zahrnují základní funkce a bezplatné kartičky.{" "}
          <Link href={`/${locale}/settings/subscription`} className="text-primary hover:underline" onClick={() => onOpenChange(false)}>
            Zobrazit kompletní srovnání
          </Link>
        </p>
      </DialogContent>
    </Dialog>
  );
}
