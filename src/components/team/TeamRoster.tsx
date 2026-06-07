"use client";

import { useState } from "react";
import Link from "next/link";
import { UserPlus, X, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updatePlayer, removePlayerFromTeam } from "@/lib/firebaseServices";
import type { Player, PlayerPosition } from "@/types";
import toast from "react-hot-toast";

const positionLabels: Record<PlayerPosition, string> = {
  goalkeeper: "Brankář",
  defender: "Obránce",
  midfielder: "Záložník",
  forward: "Útočník",
};

interface TeamRosterProps {
  teamId: string;
  userId: string;
  locale: string;
  rosterPlayers: Player[];
  availablePlayers: Player[];
  onAdd: (player: Player) => void;
  onRemove: (player: Player) => void;
}

export function TeamRoster({
  teamId,
  userId,
  locale,
  rosterPlayers,
  availablePlayers,
  onAdd,
  onRemove,
}: TeamRosterProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleAdd = async (player: Player) => {
    setLoadingId(player.id);
    try {
      await updatePlayer(userId, player.id, { teamId });
      onAdd({ ...player, teamId });
      setDialogOpen(false);
      toast.success(`${player.displayName} přidán do týmu.`);
    } catch {
      toast.error("Nepodařilo se přidat hráče.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleRemove = async (player: Player) => {
    setLoadingId(player.id);
    try {
      await removePlayerFromTeam(userId, player.id);
      onRemove(player);
      toast.success(`${player.displayName} odstraněn z týmu.`);
    } catch {
      toast.error("Nepodařilo se odebrat hráče.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Soupiska ({rosterPlayers.length})
        </h2>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 h-8 text-xs"
          onClick={() => setDialogOpen(true)}
          disabled={availablePlayers.length === 0}
        >
          <UserPlus className="h-3.5 w-3.5" />
          Přidat hráče
        </Button>
      </div>

      {rosterPlayers.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-8 text-center space-y-2">
          <Users className="h-8 w-8 text-muted-foreground/40 mx-auto" />
          <p className="text-sm text-muted-foreground">Soupiska je prázdná.</p>
          {availablePlayers.length === 0 && (
            <Link href={`/${locale}/players/new`}>
              <Button size="sm" variant="outline" className="text-xs mt-1">
                Vytvořit hráče
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          {rosterPlayers.map((player) => {
            const initials = player.displayName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);
            return (
              <div
                key={player.id}
                className="flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-muted/30 transition-colors group"
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={player.photoURL} />
                  <AvatarFallback className="text-xs font-display">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <Link href={`/${locale}/players/${player.id}`}>
                    <p className="text-sm font-medium hover:text-primary transition-colors truncate">
                      {player.displayName}
                    </p>
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {positionLabels[player.position]}
                    {player.jerseyNumber ? ` · #${player.jerseyNumber}` : ""}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => handleRemove(player)}
                  disabled={loadingId === player.id}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Přidat hráče do týmu</DialogTitle>
          </DialogHeader>
          <div className="space-y-1 max-h-72 overflow-y-auto">
            {availablePlayers.map((player) => {
              const initials = player.displayName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
              return (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => handleAdd(player)}
                  disabled={loadingId === player.id}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/60 transition-colors text-left disabled:opacity-50"
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={player.photoURL} />
                    <AvatarFallback className="text-xs font-display">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{player.displayName}</p>
                    <p className="text-xs text-muted-foreground">
                      {positionLabels[player.position]}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
