"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { CardEffect } from "@/types";

interface EffectOption {
  key: CardEffect;
  labelKey: string;
  emoji: string;
}

const EFFECTS: EffectOption[] = [
  { key: "none", labelKey: "effectNone", emoji: "✕" },
  { key: "goldFoil", labelKey: "effectGoldFoil", emoji: "✨" },
  { key: "hologram", labelKey: "effectHologram", emoji: "🌈" },
  { key: "neon", labelKey: "effectNeon", emoji: "💡" },
  { key: "led", labelKey: "effectLed", emoji: "⬛" },
  { key: "fire", labelKey: "effectFire", emoji: "🔥" },
];

interface EffectsPanelProps {
  currentEffect: CardEffect;
  onUpdateEffect: (effect: CardEffect) => void;
}

export function EffectsPanel({ currentEffect, onUpdateEffect }: EffectsPanelProps) {
  const t = useTranslations("editor");

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
        {t("effects")}
      </p>

      <div className="grid grid-cols-2 gap-2">
        {EFFECTS.map(({ key, labelKey, emoji }) => {
          const isActive = currentEffect === key;
          return (
            <button
              key={key}
              onClick={() => onUpdateEffect(key)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                isActive
                  ? "border-primary bg-primary/10 shadow-glow"
                  : "border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/60"
              )}
            >
              <span className="text-2xl leading-none" aria-hidden>
                {emoji}
              </span>
              <span className="text-xs font-medium leading-none">
                {t(labelKey as Parameters<typeof t>[0])}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
