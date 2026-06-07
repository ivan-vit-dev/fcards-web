"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Card } from "@/types";
import { CardPreview } from "@/components/card/CardPreview";
import { RarityBadge } from "@/components/card/RarityBadge";
import { CardHologramEffect } from "./CardHologramEffect";
import { BookOpen } from "lucide-react";

interface Props {
  cards: Card[];
}

export function SeasonAlbum({ cards }: Props) {
  const params = useParams();
  const locale = (params?.locale as string) ?? "cs";

  const grouped = cards.reduce<Record<string, Card[]>>((acc, card) => {
    const season = card.season ?? "Bez sezóny";
    (acc[season] ??= []).push(card);
    return acc;
  }, {});

  const seasons = Object.keys(grouped).sort().reverse();

  if (seasons.length === 0) {
    return (
      <div className="border border-dashed border-border rounded-2xl p-12 text-center space-y-2">
        <BookOpen className="h-8 w-8 text-muted-foreground/40 mx-auto" />
        <p className="text-sm text-muted-foreground">Žádné kartičky odpovídají filtru.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {seasons.map((season) => {
        const seasonCards = grouped[season];
        return (
          <section key={season}>
            <div className="flex items-center gap-3 mb-4 pb-2 border-b border-border">
              <h2 className="font-display font-bold text-lg">{season}</h2>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {seasonCards.length}
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {seasonCards.map((card) => (
                <Link key={card.id} href={`/${locale}/cards/${card.id}`}>
                  <div className="group space-y-1">
                    <div className="relative">
                      <CardPreview
                        card={card}
                        size="sm"
                        className={cn(
                          "w-full transition-transform duration-200 group-hover:scale-[1.04]",
                          (card.rarity === "legendary" || card.rarity === "mythic") &&
                            "shadow-card-legendary"
                        )}
                      />
                      <CardHologramEffect rarity={card.rarity} effect={card.effect} />
                    </div>
                    <div className="flex justify-center">
                      <RarityBadge rarity={card.rarity} className="text-[9px] px-1 py-0" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
