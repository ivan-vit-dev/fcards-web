"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlayerCard } from "@/components/player/PlayerCard";
import { useAuthStore } from "@/store/authStore";
import { usePlayersStore } from "@/store/appStore";
import { getPlayers } from "@/lib/firebaseServices";

export default function PlayersPage() {
  const { user } = useAuthStore();
  const { players, setPlayers } = usePlayersStore();
  const params = useParams();
  const locale = (params?.locale as string) ?? "cs";
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getPlayers(user.uid)
      .then(setPlayers)
      .finally(() => setLoading(false));
  }, [user, setPlayers]);

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Hráči</h1>
        <Link href={`/${locale}/players/new`}>
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Nový hráč
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : players.length === 0 ? (
        <div className="border border-dashed border-border rounded-2xl p-12 text-center space-y-3">
          <Users className="h-10 w-10 text-muted-foreground/40 mx-auto" />
          <p className="text-sm text-muted-foreground">Zatím žádní hráči.</p>
          <Link href={`/${locale}/players/new`}>
            <Button size="sm" variant="outline" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Přidat prvního hráče
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {players.map((player) => (
            <PlayerCard key={player.id} player={player} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
