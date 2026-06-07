"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CardPreview } from "./CardPreview";
import { RarityBadge } from "./RarityBadge";
import { CARD_TYPE_LABELS } from "@/lib/cardEngine";
import type { Card, Player } from "@/types";

interface Props {
  card: Card;
  player?: Player;
  onClick?: () => void;
}

export function CardFlip({ card, player, onClick }: Props) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className="relative cursor-pointer"
      style={{ perspective: "900px" }}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      onClick={onClick}
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ transformStyle: "preserve-3d", position: "relative" }}
      >
        {/* Front */}
        <div style={{ backfaceVisibility: "hidden" }}>
          <CardPreview card={card} player={player} size="sm" />
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 rounded-xl bg-card border border-border flex flex-col items-center justify-center gap-3 p-4"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <RarityBadge rarity={card.rarity} />

          <div className="text-center space-y-0.5">
            <p className="text-xs font-semibold">{CARD_TYPE_LABELS[card.cardType]}</p>
            {card.season && (
              <p className="text-[10px] text-muted-foreground">{card.season}</p>
            )}
          </div>

          {card.cardStats && (
            <div className="grid grid-cols-3 gap-1.5 w-full">
              {[
                { label: "G", value: card.cardStats.goals },
                { label: "A", value: card.cardStats.assists },
                { label: "★", value: card.cardStats.rating },
              ]
                .filter((s) => s.value !== undefined)
                .map(({ label, value }) => (
                  <div
                    key={label}
                    className="bg-muted/50 rounded-lg p-1.5 text-center"
                  >
                    <p className="text-sm font-display font-bold leading-none">{value}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">{label}</p>
                  </div>
                ))}
            </div>
          )}

          <p className="text-[10px] text-primary font-medium mt-1">Klikněte pro detail →</p>
        </div>
      </motion.div>
    </div>
  );
}
