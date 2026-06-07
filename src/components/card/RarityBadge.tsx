import { cn } from "@/lib/utils";
import type { Rarity } from "@/types";

const rarityLabels: Record<Rarity, string> = {
  common: "Běžná",
  uncommon: "Neobvyklá",
  rare: "Vzácná",
  epic: "Epická",
  legendary: "Legendární",
  mythic: "Mýtická",
  limited: "Limitovaná",
};

const rarityClasses: Record<Rarity, string> = {
  common: "bg-[color-mix(in_oklch,var(--rarity-common)_15%,transparent)] text-[var(--rarity-common)] border-[color-mix(in_oklch,var(--rarity-common)_30%,transparent)]",
  uncommon: "bg-[color-mix(in_oklch,var(--rarity-uncommon)_15%,transparent)] text-[var(--rarity-uncommon)] border-[color-mix(in_oklch,var(--rarity-uncommon)_30%,transparent)]",
  rare: "bg-[color-mix(in_oklch,var(--rarity-rare)_15%,transparent)] text-[var(--rarity-rare)] border-[color-mix(in_oklch,var(--rarity-rare)_30%,transparent)]",
  epic: "bg-[color-mix(in_oklch,var(--rarity-epic)_15%,transparent)] text-[var(--rarity-epic)] border-[color-mix(in_oklch,var(--rarity-epic)_30%,transparent)]",
  legendary: "bg-[color-mix(in_oklch,var(--rarity-legendary)_15%,transparent)] text-[var(--rarity-legendary)] border-[color-mix(in_oklch,var(--rarity-legendary)_30%,transparent)]",
  mythic: "gradient-mythic text-white border-transparent",
  limited: "bg-[color-mix(in_oklch,var(--rarity-limited)_15%,transparent)] text-[var(--rarity-limited)] border-[color-mix(in_oklch,var(--rarity-limited)_30%,transparent)]",
};

interface RarityBadgeProps {
  rarity: Rarity;
  className?: string;
}

export function RarityBadge({ rarity, className }: RarityBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border",
        rarityClasses[rarity],
        className
      )}
    >
      {rarityLabels[rarity]}
    </span>
  );
}
