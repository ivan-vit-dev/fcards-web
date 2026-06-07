import { cn } from "@/lib/utils";
import { getXPToNextLevel, getLevelTier } from "@/lib/utils";
import { LevelBadge } from "./LevelBadge";
import { getNextUnlock } from "@/lib/xpEngine";

interface Props {
  xp: number;
  className?: string;
  compact?: boolean;
}

export function XPBar({ xp, className, compact }: Props) {
  const { current, required, level } = getXPToNextLevel(xp);
  const tier = getLevelTier(level);
  const percent = Math.min(Math.round((current / required) * 100), 100);
  const nextUnlock = getNextUnlock(level);

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <LevelBadge level={level} tier={tier} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
            <span>Úroveň {level}</span>
            <span>{current} / {required} XP</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${percent}%`,
                background: "var(--primary)",
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-4">
        <LevelBadge level={level} tier={tier} size="lg" showTierLabel />
        <div className="flex-1 space-y-1.5">
          <div className="flex items-baseline justify-between">
            <span className="font-display font-bold text-lg">Úroveň {level}</span>
            <span className="text-sm text-muted-foreground">
              {current.toLocaleString()} / {required.toLocaleString()} XP
            </span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${percent}%`,
                background: "linear-gradient(90deg, var(--primary) 0%, var(--brand-accent) 100%)",
              }}
            />
          </div>
          {nextUnlock && (
            <p className="text-xs text-muted-foreground">
              Úroveň {nextUnlock.level}: {nextUnlock.labelCs}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
