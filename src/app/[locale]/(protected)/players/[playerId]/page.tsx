"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Shield,
  Target,
  Handshake,
  Star,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { PlayerForm } from "@/components/player/PlayerForm";
import { useAuthStore } from "@/store/authStore";
import { usePlayersStore } from "@/store/appStore";
import { getPlayerDoc, updatePlayer, deletePlayer } from "@/lib/firebaseServices";
import type { Player } from "@/types";
import toast from "react-hot-toast";

export default function PlayerDetailPage() {
  const { user } = useAuthStore();
  const { players, updatePlayer: updateStore, removePlayer } = usePlayersStore();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "cs";
  const playerId = params?.playerId as string;

  const [player, setPlayer] = useState<Player | null>(
    players.find((p) => p.id === playerId) ?? null
  );
  const [loading, setLoading] = useState(!player);

  useEffect(() => {
    if (player || !user || !playerId) return;
    getPlayerDoc(user.uid, playerId)
      .then(setPlayer)
      .finally(() => setLoading(false));
  }, [user, playerId, player]);

  const handleSubmit = async (data: Partial<Player>) => {
    if (!user || !player) return;
    await updatePlayer(user.uid, player.id, data);
    const updated = { ...player, ...data };
    setPlayer(updated);
    updateStore(player.id, data);
    toast.success("Změny uloženy.");
  };

  const handleDelete = async () => {
    if (!user || !player) return;
    await deletePlayer(user.uid, player.id);
    removePlayer(player.id);
    toast.success("Hráč byl smazán.");
    router.push(`/${locale}/players`);
  };

  if (loading) {
    return (
      <div className="max-w-lg space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="max-w-lg text-center py-12 space-y-3">
        <p className="text-muted-foreground">Hráč nenalezen.</p>
        <Link href={`/${locale}/players`}>
          <Button variant="outline" size="sm">Zpět na hráče</Button>
        </Link>
      </div>
    );
  }

  const stats = player.careerStats;

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/players`}>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-display font-bold truncate">{player.displayName}</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {player.isPublic && (
            <Link href={`/${locale}/player/${player.slug}`} target="_blank">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
          )}
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Smazat hráče?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tato akce je nevratná. Všechna data hráče budou trvale smazána.
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
      </div>

      {/* Career stats summary */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          Kariérní statistiky
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Zápasy", value: stats.matchesPlayed, icon: Shield },
            { label: "Góly", value: stats.goals, icon: Target },
            { label: "Asistence", value: stats.assists, icon: Handshake },
            { label: "MVP", value: stats.mvpCount, icon: Star },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-muted/40 rounded-xl p-3 text-center">
              <Icon className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
              <p className="text-xl font-display font-bold">{value}</p>
              <p className="text-[11px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Edit form */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-5">
          Upravit profil
        </h2>
        {user && (
          <PlayerForm
            userId={user.uid}
            player={player}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  );
}
