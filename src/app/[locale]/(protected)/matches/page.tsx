"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Plus, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/authStore";
import { useTeamsStore } from "@/store/appStore";
import { getTeams } from "@/lib/firebaseServices";

export default function MatchesPage() {
  const { user } = useAuthStore();
  const { teams, setTeams } = useTeamsStore();
  const params = useParams();
  const locale = (params?.locale as string) ?? "cs";
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getTeams(user.uid).then(setTeams).finally(() => setLoading(false));
  }, [user, setTeams]);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-display font-bold">Zápasy</h1>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : teams.length === 0 ? (
        <div className="border border-dashed border-border rounded-2xl p-12 text-center space-y-3">
          <Swords className="h-10 w-10 text-muted-foreground/40 mx-auto" />
          <p className="text-sm text-muted-foreground">
            Nejprve vytvořte tým, poté přidejte zápasy.
          </p>
          <Link href={`/${locale}/teams/new`}>
            <Button size="sm" variant="outline">
              Vytvořit tým
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Vyberte tým pro správu zápasů.
          </p>
          {teams.map((team) => (
            <Link
              key={team.id}
              href={`/${locale}/teams/${team.id}/matches/new`}
            >
              <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:border-primary/40 transition-colors cursor-pointer group">
                <div>
                  <p className="font-medium text-sm group-hover:text-primary transition-colors">
                    {team.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {team.season}
                    {team.ageGroup ? ` · ${team.ageGroup}` : ""}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-xs h-7 shrink-0"
                  tabIndex={-1}
                >
                  <Plus className="h-3 w-3" />
                  Nový zápas
                </Button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
