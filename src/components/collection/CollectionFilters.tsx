"use client";

import { cn } from "@/lib/utils";
import type { CardType, Rarity } from "@/types";
import type {
  CollectionFilters as Filters,
  CollectionSortBy,
  CollectionView,
} from "@/hooks/use-collection";
import { RARITY_ORDER, CARD_TYPES, CARD_TYPE_LABELS } from "@/lib/cardEngine";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LayoutGrid, BookOpen } from "lucide-react";

const RARITY_LABELS: Record<Rarity, string> = {
  common: "Běžná",
  uncommon: "Neobvyklá",
  rare: "Vzácná",
  epic: "Epická",
  legendary: "Legendární",
  mythic: "Mýtická",
  limited: "Limitovaná",
};

interface Props {
  filters: Filters;
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  view: CollectionView;
  setView: (v: CollectionView) => void;
  availableSeasons: string[];
  totalCount: number;
}

export function CollectionFilters({
  filters,
  setFilter,
  view,
  setView,
  availableSeasons,
  totalCount,
}: Props) {
  return (
    <div className="space-y-3">
      {/* Top row: count + sort + view toggle */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-sm text-muted-foreground">{totalCount} kartiček</p>
        <div className="flex items-center gap-2">
          <Select
            value={filters.sortBy}
            onValueChange={(v) => setFilter("sortBy", v as CollectionSortBy)}
          >
            <SelectTrigger className="h-8 text-xs w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Nejnovější</SelectItem>
              <SelectItem value="oldest">Nejstarší</SelectItem>
              <SelectItem value="rarity-desc">Nejvzácnější</SelectItem>
              <SelectItem value="rarity-asc">Nejběžnější</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setView("grid")}
              className={cn(
                "p-1.5 transition-colors",
                view === "grid"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label="Mřížka"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setView("album")}
              className={cn(
                "p-1.5 transition-colors",
                view === "album"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label="Album"
            >
              <BookOpen className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Rarity chips */}
      <div className="flex flex-wrap gap-1.5">
        <FilterChip
          active={filters.rarity === "all"}
          onClick={() => setFilter("rarity", "all")}
        >
          Vše
        </FilterChip>
        {RARITY_ORDER.map((r) => (
          <FilterChip
            key={r}
            active={filters.rarity === r}
            onClick={() => setFilter("rarity", r)}
          >
            {RARITY_LABELS[r]}
          </FilterChip>
        ))}
      </div>

      {/* Card type + season selects */}
      <div className="flex flex-wrap gap-2">
        <Select
          value={filters.cardType}
          onValueChange={(v) => setFilter("cardType", v as CardType | "all")}
        >
          <SelectTrigger className="h-8 text-xs w-44">
            <SelectValue placeholder="Typ kartičky" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Všechny typy</SelectItem>
            {CARD_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {CARD_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {availableSeasons.length > 0 && (
          <Select
            value={filters.season}
            onValueChange={(v) => setFilter("season", v ?? "all")}
          >
            <SelectTrigger className="h-8 text-xs w-32">
              <SelectValue placeholder="Sezóna" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Všechny sezóny</SelectItem>
              {availableSeasons.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2.5 py-1 text-xs rounded-full border transition-colors",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "border-border text-muted-foreground hover:border-primary/60 hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
