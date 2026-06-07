"use client";

import { useMemo, useState } from "react";
import type { Card, CardType, Rarity } from "@/types";
import { RARITY_ORDER } from "@/lib/cardEngine";

export type CollectionSortBy = "newest" | "oldest" | "rarity-asc" | "rarity-desc";
export type CollectionView = "grid" | "album";

export interface CollectionFilters {
  rarity: Rarity | "all";
  cardType: CardType | "all";
  season: string;
  sortBy: CollectionSortBy;
}

const PAGE_SIZE = 24;

export function useCollection(cards: Card[]) {
  const [filters, setFiltersState] = useState<CollectionFilters>({
    rarity: "all",
    cardType: "all",
    season: "all",
    sortBy: "newest",
  });
  const [view, setView] = useState<CollectionView>("grid");
  const [page, setPage] = useState(1);

  const availableSeasons = useMemo(() => {
    const seasons = new Set<string>();
    for (const card of cards) {
      if (card.season) seasons.add(card.season);
    }
    return Array.from(seasons).sort().reverse();
  }, [cards]);

  const filtered = useMemo(() => {
    let result = [...cards];

    if (filters.rarity !== "all") {
      result = result.filter((c) => c.rarity === filters.rarity);
    }
    if (filters.cardType !== "all") {
      result = result.filter((c) => c.cardType === filters.cardType);
    }
    if (filters.season !== "all") {
      result = result.filter((c) => c.season === filters.season);
    }

    result.sort((a, b) => {
      switch (filters.sortBy) {
        case "newest":
          return b.createdAt.toMillis() - a.createdAt.toMillis();
        case "oldest":
          return a.createdAt.toMillis() - b.createdAt.toMillis();
        case "rarity-desc":
          return RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity);
        case "rarity-asc":
          return RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity);
        default:
          return 0;
      }
    });

    return result;
  }, [cards, filters]);

  const paginated = useMemo(() => filtered.slice(0, page * PAGE_SIZE), [filtered, page]);
  const hasMore = paginated.length < filtered.length;

  function loadMore() {
    setPage((p) => p + 1);
  }

  function setFilter<K extends keyof CollectionFilters>(key: K, value: CollectionFilters[K]) {
    setFiltersState((f) => ({ ...f, [key]: value }));
    setPage(1);
  }

  return {
    filters,
    setFilter,
    view,
    setView,
    filtered,
    paginated,
    hasMore,
    loadMore,
    availableSeasons,
    totalCount: filtered.length,
  };
}
