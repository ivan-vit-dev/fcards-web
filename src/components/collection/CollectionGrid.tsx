"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Card } from "@/types";
import { CardPreview } from "@/components/card/CardPreview";
import { RarityBadge } from "@/components/card/RarityBadge";
import { CardHologramEffect } from "./CardHologramEffect";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  cards: Card[];
  hasMore: boolean;
  onLoadMore: () => void;
  loading?: boolean;
}

export function CollectionGrid({ cards, hasMore, onLoadMore, loading }: Props) {
  const params = useParams();
  const locale = (params?.locale as string) ?? "cs";
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) onLoadMore();
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[5/7] rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Link key={card.id} href={`/${locale}/cards/${card.id}`}>
            <div className="group space-y-2">
              <div className="relative">
                <CardPreview
                  card={card}
                  size="sm"
                  className={cn(
                    "w-full transition-transform duration-200 group-hover:scale-[1.03]",
                    (card.rarity === "legendary" || card.rarity === "mythic") &&
                      "shadow-card-legendary"
                  )}
                />
                <CardHologramEffect rarity={card.rarity} effect={card.effect} />
              </div>
              <div className="px-0.5">
                <RarityBadge rarity={card.rarity} className="text-[10px]" />
                {card.season && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {card.season}
                  </p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {hasMore && <div ref={sentinelRef} className="h-8 mt-4" />}
    </>
  );
}
