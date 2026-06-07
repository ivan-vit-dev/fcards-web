"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { TeamForm } from "@/components/team/TeamForm";
import { TeamRoster } from "@/components/team/TeamRoster";
import { InvitePanel } from "@/components/team/InvitePanel";
import { useAuthStore } from "@/store/authStore";
import { useTeamsStore, usePlayersStore, useMatchesStore } from "@/store/appStore";
import {
  getTeamDoc,
  updateTeam,
  deleteTeam,
  getPlayers,
  getMatches,
} from "@/lib/firebaseServices";
import type { Team, Player } from "@/types";
import toast from "react-hot-toast";

const resultBadge: Record<string, string> = {
  win: "bg-green-500/10 text-green-600 dark:text-green-400",
  draw: "bg-muted/60 text-muted-foreground",
  loss: "bg-red-500/10 text-red-600 dark:text-red-400",
};
const resultLabel: Record<string, string> = { win: "V", draw: "R", loss: "P" };

export default function TeamDetailPage() {
  const { user } = useAuthStore();
  const { teams, updateTeam: updateStore, removeTeam } = useTeamsStore();
  const { players, setPlayers, updatePlayer: updatePlayerStore } = usePlayersStore();
  const { matches, setMatches } = useMatchesStore();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "cs";
  const teamId = params?.teamId as string;

  const [team, setTeam] = useState<Team | null>(
    teams.find((t) => t.id === teamId) ?? null
  );
  const [loading, setLoading] = useState(!team);

  useEffect(() => {
    if (!user || !teamId) return;
    Promise.all([
      team ? Promise.resolve(team) : getTeamDoc(teamId),
      getPlayers(user.uid),
      getMatches(teamId),
    ]).then(([teamDoc, allPlayers, teamMatches]) => {
      if (teamDoc) setTeam(teamDoc);
      setPlayers(allPlayers);
      setMatches(teamMatches);
    }).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, teamId]);

  const handleUpdate = async (data: Partial<Team>) => {
    if (!team) return;
    await updateTeam(team.id, data);
    const updated = { ...team, ...data };
    setTeam(updated);
    updateStore(team.id, data);
    toast.success("Tým upraven.");
  };

  const handleDelete = async () => {
    if (!team) return;
    await deleteTeam(team.id);
    removeTeam(team.id);
    toast.success("Tým byl smazán.");
    router.push(`/${locale}/teams`);
  };

  const rosterPlayers = players.filter((p) => p.teamId === teamId);
  const availablePlayers = players.filter((p) => !p.teamId || p.teamId !== teamId);

  if (loading) {
    return (
      <div className="max-w-2xl space-y-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-10 rounded-lg" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="max-w-lg text-center py-12 space-y-3">
        <p className="text-muted-foreground">Tým nenalezen.</p>
        <Link href={`/${locale}/teams`}>
          <Button variant="outline" size="sm">
            Zpět na týmy
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href={`/${locale}/teams`}>
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl font-display font-bold truncate">{team.name}</h1>
            <p className="text-xs text-muted-foreground">
              {team.season}
              {team.ageGroup ? ` · ${team.ageGroup}` : ""}
            </p>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-destructive hover:text-destructive shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Smazat tým?</AlertDialogTitle>
              <AlertDialogDescription>
                Tato akce je nevratná. Všechna data týmu budou trvale smazána.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Zrušit</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Smazat
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Tabs defaultValue="roster">
        <TabsList className="w-full">
          <TabsTrigger value="roster" className="flex-1">
            Soupiska
          </TabsTrigger>
          <TabsTrigger value="matches" className="flex-1">
            Zápasy
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex-1">
            Nastavení
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roster" className="mt-4">
          <TeamRoster
            teamId={teamId}
            userId={user!.uid}
            locale={locale}
            rosterPlayers={rosterPlayers}
            availablePlayers={availablePlayers}
            onAdd={(p: Player) => updatePlayerStore(p.id, { teamId })}
            onRemove={(p: Player) => updatePlayerStore(p.id, { teamId: undefined })}
          />
        </TabsContent>

        <TabsContent value="matches" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Zápasy ({matches.length})
            </h2>
            <Link href={`/${locale}/teams/${teamId}/matches/new`}>
              <Button size="sm" className="gap-1.5 h-8 text-xs">
                <Plus className="h-3.5 w-3.5" />
                Přidat zápas
              </Button>
            </Link>
          </div>

          {matches.length === 0 ? (
            <div className="border border-dashed border-border rounded-xl p-8 text-center space-y-2">
              <p className="text-sm text-muted-foreground">Zatím žádné zápasy.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {matches.map((match) => (
                <Link
                  key={match.id}
                  href={`/${locale}/teams/${teamId}/matches/${match.id}`}
                >
                  <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:border-primary/40 transition-colors cursor-pointer">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-md shrink-0 ${resultBadge[match.result]}`}
                    >
                      {resultLabel[match.result]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        vs. {match.opponent}
                      </p>
                      <p className="text-xs text-muted-foreground">{match.date}</p>
                    </div>
                    <p className="text-sm font-display font-bold shrink-0">
                      {match.homeScore}:{match.awayScore}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="mt-4 space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
              Upravit tým
            </h3>
            <TeamForm team={team} onSubmit={handleUpdate} />
          </div>
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
              Sdílet / Pozvat
            </h3>
            <InvitePanel teamId={teamId} locale={locale} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
