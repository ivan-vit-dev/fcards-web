"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Card } from "@/types";
import { CardPreview } from "@/components/card/CardPreview";
import { RarityBadge } from "@/components/card/RarityBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlayersStore } from "@/store/appStore";

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
  const players = usePlayersStore((s) => s.players);

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
      <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="w-[210px] h-[294px] mx-auto rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-5">
        {cards.map((card) => (
          <Link key={card.id} href={`/${locale}/cards/${card.id}`}>
            <div className="group space-y-2">
              <div className="relative w-fit mx-auto">
                <CardPreview
                  card={card}
                  player={players.find((p) => p.id === card.playerId)}
                  size="md"
                  className="transition-transform duration-200 group-hover:scale-[1.03]"
                />
              </div>
              <div className="px-0.5 text-center">
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
