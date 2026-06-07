import { cn } from "@/lib/utils";
import { RarityBadge } from "@/components/card/RarityBadge";
import { Lock } from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Achievement } from "@/types";

interface Props {
  achievement: Achievement;
  unlocked: boolean;
  unlockedAt?: string;
  className?: string;
}

export function AchievementCard({ achievement, unlocked, unlockedAt, className }: Props) {
  const IconComponent: LucideIcon =
    ((LucideIcons as unknown) as Record<string, LucideIcon>)[toPascalCase(achievement.iconName)]
    ?? LucideIcons.Award;

  return (
    <div
      className={cn(
        "relative rounded-xl border p-4 flex flex-col gap-3 transition-all duration-200",
        unlocked
          ? "bg-card border-border shadow-sm hover:shadow-md"
          : "bg-muted/30 border-dashed border-border/60 opacity-60",
        className
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
          unlocked ? "bg-primary/10" : "bg-muted"
        )}
      >
        {unlocked ? (
          <IconComponent className="h-5 w-5 text-primary" />
        ) : (
          <Lock className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={cn("font-semibold text-sm leading-tight", !unlocked && "text-muted-foreground")}>
          {achievement.nameCs}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
          {achievement.descriptionCs}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <RarityBadge rarity={achievement.rarity} className="text-[10px] px-1.5 py-0" />
        <span className={cn("text-xs font-medium", unlocked ? "text-primary" : "text-muted-foreground")}>
          +{achievement.xpReward} XP
        </span>
      </div>

      {unlockedAt && (
        <p className="text-[10px] text-muted-foreground/70 -mt-1">{unlockedAt}</p>
      )}
    </div>
  );
}

function toPascalCase(str: string): string {
  return str
    .split(/[-_\s]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}
