"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { CardPreview } from "@/components/card/CardPreview";
import { RarityBadge } from "@/components/card/RarityBadge";
import { cn } from "@/lib/utils";
import type { Card } from "@/types";

interface Props {
  cards: Card[];
  selected: Set<string>;
  maxSelectable: number;
  onToggle: (cardId: string) => void;
}

export function CardSelectionGrid({ cards, selected, maxSelectable, onToggle }: Props) {
  if (cards.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground">
        Žádné kartičky k dispozici. Vytvořte kartičky v sekci Kartičky.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Vybráno: <span className="font-semibold text-foreground">{selected.size}</span> / {maxSelectable}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto pr-1">
        {cards.map((card) => {
          const isSelected = selected.has(card.id);
          const isDisabled = !isSelected && selected.size >= maxSelectable;

          return (
            <button
              key={card.id}
              type="button"
              onClick={() => !isDisabled && onToggle(card.id)}
              disabled={isDisabled}
              className={cn(
                "relative flex flex-col gap-1.5 rounded-xl p-1.5 border transition-all text-left",
                isSelected
                  ? "border-primary bg-primary/8"
                  : isDisabled
                  ? "border-border opacity-40 cursor-not-allowed"
                  : "border-border hover:border-primary/50 hover:bg-muted/30 cursor-pointer"
              )}
            >
              {/* Selection indicator */}
              <div className="absolute top-2.5 right-2.5 z-10">
                {isSelected ? (
                  <CheckCircle2 className="h-5 w-5 text-primary drop-shadow-sm" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground/60 drop-shadow-sm" />
                )}
              </div>

              <CardPreview card={card} size="sm" />

              <div className="px-0.5 pb-0.5">
                <RarityBadge rarity={card.rarity} />
                {card.season && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">{card.season}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
