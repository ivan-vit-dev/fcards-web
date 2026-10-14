"use client";

import { useState } from "react";
import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRESETS, PRESET_TAGS, type Preset, type PresetTag } from "@/lib/cardDesign";
import { TIER_LABELS } from "@/lib/subscriptionEngine";
import { CardPreview } from "./CardPreview";
import type { Card, Player } from "@/types";

interface Props {
  card: Card; // sample/actual card rendered in every preset
  player?: Player;
  selectedId?: string;
  canUse: (preset: Preset) => boolean;
  onSelect: (preset: Preset) => void;
  columns?: string; // grid-cols classes
}

// Preset picker: every preset is rendered with the real player, so users see their own card.
export function DesignGallery({
  card,
  player,
  selectedId,
  canUse,
  onSelect,
  columns = "grid-cols-2 sm:grid-cols-3",
}: Props) {
  const [tag, setTag] = useState<PresetTag | "all">("all");
  const shown = tag === "all" ? PRESETS : PRESETS.filter((p) => p.tags.includes(tag));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Kategorie vzhledů">
        {[{ id: "all" as const, nameCs: "Vše" }, ...PRESET_TAGS].map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tag === t.id}
            onClick={() => setTag(t.id)}
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
              tag === t.id
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {t.nameCs}
          </button>
        ))}
      </div>

      <div className={cn("grid gap-3", columns)}>
        {shown.map((preset) => {
          const allowed = canUse(preset);
          const selected = selectedId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => allowed && onSelect(preset)}
              disabled={!allowed}
              aria-pressed={selected}
              className={cn(
                "relative rounded-xl border-2 text-left transition-colors overflow-hidden",
                selected ? "border-primary" : "border-border",
                allowed ? "hover:border-primary/50" : "cursor-not-allowed"
              )}
            >
              <div className="flex justify-center bg-muted/40 py-3">
                <CardPreview card={card} player={player} design={preset.design} size="sm" />
              </div>
              {selected && (
                <span className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <Check className="h-3.5 w-3.5" />
                </span>
              )}
              {!allowed && (
                <span className="absolute inset-0 bg-background/60 flex items-center justify-center">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </span>
              )}
              <div className="p-2">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-xs font-semibold truncate">{preset.nameCs}</p>
                  {preset.requiredTier !== "free" && (
                    <span className="shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
                      {TIER_LABELS[preset.requiredTier]}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground truncate">{preset.descriptionCs}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
