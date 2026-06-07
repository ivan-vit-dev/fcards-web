"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsEntryForm } from "@/components/match/StatsEntryForm";
import { useAuthStore } from "@/store/authStore";
import { usePlayersStore } from "@/store/appStore";
import {
  getMatchDoc,
  getPlayerMatchStats,
  setPlayerMatchStats,
  getPlayers,
} from "@/lib/firebaseServices";
import type { Match, PlayerMatchStats } from "@/types";
import toast from "react-hot-toast";

const resultLabel: Record<string, string> = {
  win: "Výhra",
  draw: "Remíza",
  loss: "Prohra",
};

const resultClass: Record<string, string> = {
  win: "text-green-600 dark:text-green-400",
  draw: "text-muted-foreground",
  loss: "text-red-600 dark:text-red-400",
};

export default function MatchDetailPage() {
  const { user } = useAuthStore();
  const { players, setPlayers } = usePlayersStore();
  const params = useParams();
  const locale = (params?.locale as string) ?? "cs";
  const teamId = params?.teamId as string;
  const matchId = params?.matchId as string;

  const [match, setMatch] = useState<Match | null>(null);
  const [statsMap, setStatsMap] = useState<Record<string, PlayerMatchStats>>({});
  const [loading, setLoading] = useState(true);

  const rosterPlayers = players.filter((p) => p.teamId === teamId);

  useEffect(() => {
    if (!user || !matchId || !teamId) return;
    Promise.all([
      getMatchDoc(matchId),
      getPlayers(user.uid),
      getPlayerMatchStats(matchId),
    ]).then(([matchDoc, allPlayers, matchStats]) => {
      setMatch(matchDoc);
      setPlayers(allPlayers);
      const map: Record<string, PlayerMatchStats> = {};
      matchStats.forEach((s) => {
        map[s.playerId] = s;
      });
      setStatsMap(map);
    }).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, matchId, teamId]);

  const handleStatsSubmit = async (
    playerId: string,
    data: Partial<PlayerMatchStats>
  ) => {
    if (!user) return;
    try {
      await setPlayerMatchStats(matchId, playerId, data);
      setStatsMap((prev) => ({
        ...prev,
        [playerId]: { id: playerId, ...data } as PlayerMatchStats,
      }));
      toast.success("Statistiky uloženy.");
    } catch {
      toast.error("Nepodařilo se uložit statistiky.");
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="max-w-lg text-center py-12 space-y-3">
        <p className="text-muted-foreground">Zápas nenalezen.</p>
        <Link href={`/${locale}/teams/${teamId}`}>
          <Button variant="outline" size="sm">
            Zpět na tým
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/${locale}/teams/${teamId}`}>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-display font-bold">vs. {match.opponent}</h1>
      </div>

      {/* Match summary card */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">
              {match.date}
              {match.venue ? ` · ${match.venue}` : ""}
            </p>
            <p className={`text-sm font-medium ${resultClass[match.result]}`}>
              {resultLabel[match.result]} · {match.isHome ? "Doma" : "Venku"}
            </p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-display font-bold tracking-tight">
              {match.homeScore}:{match.awayScore}
            </p>
          </div>
        </div>
        {match.notes && (
          <p className="text-sm text-muted-foreground border-t border-border pt-3 mt-4">
            {match.notes}
          </p>
        )}
      </div>

      {/* Per-player stats */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Statistiky hráčů ({rosterPlayers.length})
        </h2>

        {rosterPlayers.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-8 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Soupiska je prázdná. Nejprve přidejte hráče do týmu.
            </p>
            <Link href={`/${locale}/teams/${teamId}`}>
              <Button size="sm" variant="outline">
                Spravovat soupisku
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {rosterPlayers.map((player) => (
              <StatsEntryForm
                key={player.id}
                player={player}
                matchId={matchId}
                userId={user!.uid}
                existingStats={statsMap[player.id]}
                onSubmit={handleStatsSubmit}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
