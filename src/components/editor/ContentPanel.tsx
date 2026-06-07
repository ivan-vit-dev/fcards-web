"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Card, Player, CardStats } from "@/types";

interface ContentPanelProps {
  card: Card;
  player: Player | null;
  onUpdateStat: (key: keyof CardStats, value: number) => void;
  onUpdateSeason: (season: string) => void;
}

export function ContentPanel({
  card,
  player,
  onUpdateStat,
  onUpdateSeason,
}: ContentPanelProps) {
  const t = useTranslations("editor");

  type StatField = { key: keyof CardStats; label: string; min: number; max: number; step: number };
  const allStatFields: StatField[] = [
    { key: "goals", label: t("goals"), min: 0, max: 99, step: 1 },
    { key: "assists", label: t("assists"), min: 0, max: 99, step: 1 },
    { key: "rating", label: t("rating"), min: 0, max: 10, step: 0.1 },
    { key: "overall", label: t("overall"), min: 0, max: 99, step: 1 },
  ];
  const statFields = allStatFields.filter(({ key }) => card.cardStats[key] !== undefined);

  return (
    <div className="space-y-5">
      {/* Player info — read-only */}
      {player && (
        <div className="p-3 rounded-xl bg-muted/40 border border-border">
          <p className="text-sm font-semibold truncate">{player.displayName}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {card.cardType}
          </p>
        </div>
      )}

      {/* Season */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
          {t("season")}
        </Label>
        <Input
          value={card.season ?? ""}
          onChange={(e) => onUpdateSeason(e.target.value)}
          placeholder="2024/25"
          className="h-9"
        />
      </div>

      {/* Stats */}
      {statFields.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
            {t("stats")}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {statFields.map(({ key, label, min, max, step }) => (
              <div key={key} className="space-y-1">
                <Label className="text-xs text-muted-foreground">{label}</Label>
                <Input
                  type="number"
                  min={min}
                  max={max}
                  step={step}
                  value={card.cardStats[key] ?? 0}
                  onChange={(e) =>
                    onUpdateStat(key, parseFloat(e.target.value) || 0)
                  }
                  className="h-9"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
