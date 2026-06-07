import { cn } from "@/lib/utils";
import type { CardEffect, Rarity } from "@/types";

interface Props {
  rarity: Rarity;
  effect?: CardEffect;
  className?: string;
}

export function CardHologramEffect({ rarity, effect, className }: Props) {
  const isHolographic = rarity === "mythic" || effect === "hologram";
  if (!isHolographic) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 rounded-xl pointer-events-none overflow-hidden",
        className
      )}
    >
      <div className="gradient-mythic absolute inset-0 opacity-30 mix-blend-overlay" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/10" />
    </div>
  );
}
