"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Plus, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { useCardsStore } from "@/store/appStore";
import { getCards } from "@/lib/firebaseServices";
import { useCollection } from "@/hooks/use-collection";
import { CollectionFilters } from "@/components/collection/CollectionFilters";
import { CollectionGrid } from "@/components/collection/CollectionGrid";
import { SeasonAlbum } from "@/components/collection/SeasonAlbum";

export default function CardsPage() {
  const { user } = useAuthStore();
  const { cards, setCards } = useCardsStore();
  const params = useParams();
  const locale = (params?.locale as string) ?? "cs";
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getCards(user.uid).then(setCards).finally(() => setLoading(false));
  }, [user, setCards]);

  const {
    filters,
    setFilter,
    view,
    setView,
    filtered,
    paginated,
    hasMore,
    loadMore,
    availableSeasons,
    totalCount,
  } = useCollection(cards);

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Kartičky</h1>
        <Link href={`/${locale}/cards/new`}>
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Nová kartička
          </Button>
        </Link>
      </div>

      {loading ? (
        <CollectionGrid cards={[]} hasMore={false} onLoadMore={() => {}} loading />
      ) : cards.length === 0 ? (
        <div className="border border-dashed border-border rounded-2xl p-12 text-center space-y-3">
          <CreditCard className="h-10 w-10 text-muted-foreground/40 mx-auto" />
          <p className="text-sm text-muted-foreground">Zatím žádné kartičky.</p>
          <Link href={`/${locale}/cards/new`}>
            <Button size="sm" variant="outline" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Vytvořit první kartičku
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <CollectionFilters
            filters={filters}
            setFilter={setFilter}
            view={view}
            setView={setView}
            availableSeasons={availableSeasons}
            totalCount={totalCount}
          />

          {view === "album" ? (
            <SeasonAlbum cards={filtered} />
          ) : (
            <CollectionGrid
              cards={paginated}
              hasMore={hasMore}
              onLoadMore={loadMore}
            />
          )}
        </>
      )}
    </div>
  );
}
