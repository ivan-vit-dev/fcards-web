"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RarityBadge } from "@/components/card/RarityBadge";
import { FLAG_SHAPES, Flag } from "@/components/card/Flag";
import { TeamCrest } from "@/components/card/TeamCrest";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { BADGE_PLACEMENTS, badgePlacementsFor, resolveBadges, resolveDesign } from "@/lib/cardDesign";
import type { BadgePlacementId, Card, CardBadges, FlagShapeId, Player, CardStats, Rarity } from "@/types";

const RARITIES: Rarity[] = ["common", "uncommon", "rare", "epic", "legendary", "mythic", "limited"];

interface ContentPanelProps {
  card: Card;
  player: Player | null;
  onUpdateStat: (key: keyof CardStats, value: number) => void;
  onUpdateSeason: (season: string) => void;
  onUpdateRarity: (rarity: Rarity) => void;
  /** Re-reads flag and club from the player's profile (older cards have none stored). */
  onRefreshIdentity: () => Promise<void>;
  onUpdateBadges: (badges: CardBadges) => void;
}

export function ContentPanel({
  card,
  player,
  onUpdateStat,
  onUpdateSeason,
  onUpdateRarity,
  onRefreshIdentity,
  onUpdateBadges,
}: ContentPanelProps) {
  const t = useTranslations("editor");
  const [refreshing, setRefreshing] = useState(false);
  const layout = resolveDesign(card).layout;
  const badges = resolveBadges(card.badges, layout);
  const placements = badgePlacementsFor(layout);

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

      {/* Flag + club crest */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Vlajka a klub</p>
        <div className="flex items-center gap-3 rounded-xl border border-border p-3">
          <Flag code={card.nationality ?? player?.nationality ?? "CZ"} style={{ width: 28, borderRadius: 3 }} />
          {card.team ? (
            <TeamCrest team={card.team} fallbackColor="#1e3a8a" style={{ width: 26, height: 26 }} />
          ) : null}
          <p className="flex-1 min-w-0 text-sm truncate">
            {card.team?.name ?? <span className="text-muted-foreground">Bez klubu</span>}
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={refreshing}
            onClick={async () => {
              setRefreshing(true);
              try {
                await onRefreshIdentity();
              } finally {
                setRefreshing(false);
              }
            }}
          >
            Načíst z profilu hráče
          </Button>
        </div>
        <div className="space-y-3 rounded-xl border border-border p-3">
          {(
            [
              { key: "flag", label: "Zobrazit vlajku", disabled: false },
              { key: "crest", label: "Zobrazit klubový znak", disabled: !card.team },
            ] as const
          ).map(({ key, label, disabled }) => (
            <div key={key} className="flex items-center justify-between gap-3">
              <label htmlFor={`badge-${key}`} className={cn("text-sm", disabled && "text-muted-foreground")}>
                {label}
                {disabled && <span className="block text-xs">Nejdřív načtěte klub z profilu hráče.</span>}
              </label>
              <Switch
                id={`badge-${key}`}
                checked={badges[key] && !disabled}
                disabled={disabled}
                onCheckedChange={(v) => onUpdateBadges({ ...badges, [key]: v })}
              />
            </div>
          ))}

          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Umístění</p>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(BADGE_PLACEMENTS) as BadgePlacementId[]).map((id) => {
                const available = placements.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    disabled={!available || (!badges.flag && !badges.crest)}
                    aria-pressed={badges.placement === id}
                    title={available ? undefined : "V tomto rozložení kartičky není k dispozici"}
                    onClick={() => onUpdateBadges({ ...badges, placement: id })}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
                      badges.placement === id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    {BADGE_PLACEMENTS[id].nameCs}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Tvar vlajky</p>
            <div className="grid grid-cols-4 gap-1.5">
              {(Object.keys(FLAG_SHAPES) as FlagShapeId[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  disabled={!badges.flag}
                  aria-pressed={badges.flagShape === id}
                  title={FLAG_SHAPES[id].nameCs}
                  onClick={() => onUpdateBadges({ ...badges, flagShape: id })}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border-2 p-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
                    badges.flagShape === id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  )}
                >
                  <span className="flex h-7 items-center">
                    <Flag code={card.nationality ?? player?.nationality ?? "CZ"} shape={id} style={{ width: 30 }} />
                  </span>
                  <span className="text-[10px] leading-tight">{FLAG_SHAPES[id].nameCs}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            {placements.length < Object.keys(BADGE_PLACEMENTS).length && (
              <p className="text-[11px] text-muted-foreground">
                Některá umístění mají jen rozložení „Herní karta“ a „Pro“.
              </p>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Národnost a tým hráče nastavíte v jeho profilu, logo a barvu v nastavení týmu.
        </p>
      </div>

      {/* Rarity */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
          {t("rarity")}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {RARITIES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onUpdateRarity(r)}
              aria-pressed={card.rarity === r}
              className={cn(
                "transition-all rounded-md",
                card.rarity === r
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  : "opacity-60 hover:opacity-100"
              )}
            >
              <RarityBadge rarity={r} />
            </button>
          ))}
        </div>
      </div>

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
