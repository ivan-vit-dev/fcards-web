import { cn } from "@/lib/utils";
import type { LevelTier } from "@/types";

const TIER_STYLES: Record<LevelTier, string> = {
  bronze: "bg-[oklch(0.65_0.10_55)] text-[oklch(0.15_0.04_55)] border-[oklch(0.55_0.12_55)]",
  silver: "bg-[oklch(0.75_0.01_0)] text-[oklch(0.15_0.01_0)] border-[oklch(0.60_0.02_0)]",
  gold:   "bg-[var(--rarity-legendary)] text-[oklch(0.10_0.01_75)] border-[oklch(0.62_0.15_75)]",
  diamond:"bg-[oklch(0.62_0.23_258)] text-white border-[oklch(0.52_0.22_258)]",
};

const TIER_LABELS: Record<LevelTier, string> = {
  bronze: "Bronz",
  silver: "Stříbro",
  gold:   "Zlato",
  diamond:"Diamant",
};

interface Props {
  level: number;
  tier: LevelTier;
  size?: "sm" | "md" | "lg";
  showTierLabel?: boolean;
  className?: string;
}

const SIZE_CLASSES = {
  sm: "h-7 w-7 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
};

export function LevelBadge({ level, tier, size = "md", showTierLabel, className }: Props) {
  return (
    <div className={cn("flex flex-col items-center gap-0.5", className)}>
      <div
        className={cn(
          "rounded-full border-2 font-display font-bold flex items-center justify-center",
          SIZE_CLASSES[size],
          TIER_STYLES[tier]
        )}
      >
        {level}
      </div>
      {showTierLabel && (
        <span className="text-[10px] text-muted-foreground font-medium">
          {TIER_LABELS[tier]}
        </span>
      )}
    </div>
  );
}
