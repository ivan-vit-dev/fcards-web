"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Plus, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamCard } from "@/components/team/TeamCard";
import { useAuthStore } from "@/store/authStore";
import { useTeamsStore, usePlayersStore } from "@/store/appStore";
import { getTeams, getPlayers } from "@/lib/firebaseServices";

export default function TeamsPage() {
  const { user } = useAuthStore();
  const { teams, setTeams } = useTeamsStore();
  const { players, setPlayers } = usePlayersStore();
  const params = useParams();
  const locale = (params?.locale as string) ?? "cs";
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getTeams(user.uid).then(setTeams),
      getPlayers(user.uid).then(setPlayers),
    ]).finally(() => setLoading(false));
  }, [user, setTeams, setPlayers]);

  const getPlayerCount = (teamId: string) =>
    players.filter((p) => p.teamId === teamId).length;

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Týmy</h1>
        <Link href={`/${locale}/teams/new`}>
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Nový tým
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : teams.length === 0 ? (
        <div className="border border-dashed border-border rounded-2xl p-12 text-center space-y-3">
          <UsersRound className="h-10 w-10 text-muted-foreground/40 mx-auto" />
          <p className="text-sm text-muted-foreground">Zatím žádné týmy.</p>
          <Link href={`/${locale}/teams/new`}>
            <Button size="sm" variant="outline" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Vytvořit první tým
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              locale={locale}
              playerCount={getPlayerCount(team.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
