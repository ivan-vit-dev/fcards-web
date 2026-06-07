"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Player, PlayerMatchStats } from "@/types";

const schema = z.object({
  minutesPlayed: z.number().int().min(0).max(120),
  goals: z.number().int().min(0),
  assists: z.number().int().min(0),
  yellowCards: z.number().int().min(0).max(2),
  redCards: z.number().int().min(0).max(1),
  cleanSheet: z.boolean(),
  saves: z.number().int().min(0),
  rating: z.number().min(1).max(10),
  isMVP: z.boolean(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const positionLabels: Record<string, string> = {
  goalkeeper: "Brankář",
  defender: "Obránce",
  midfielder: "Záložník",
  forward: "Útočník",
};

interface StatsEntryFormProps {
  player: Player;
  matchId: string;
  userId: string;
  existingStats?: PlayerMatchStats;
  onSubmit: (playerId: string, data: Partial<PlayerMatchStats>) => Promise<void>;
}

export function StatsEntryForm({
  player,
  matchId,
  userId,
  existingStats,
  onSubmit,
}: StatsEntryFormProps) {
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      minutesPlayed: existingStats?.minutesPlayed ?? 90,
      goals: existingStats?.goals ?? 0,
      assists: existingStats?.assists ?? 0,
      yellowCards: existingStats?.yellowCards ?? 0,
      redCards: existingStats?.redCards ?? 0,
      cleanSheet: existingStats?.cleanSheet ?? false,
      saves: existingStats?.saves ?? 0,
      rating: existingStats?.rating ?? 7,
      isMVP: existingStats?.isMVP ?? false,
      notes: existingStats?.notes ?? "",
    },
  });

  const isMVP = watch("isMVP");
  const cleanSheet = watch("cleanSheet");
  const isGoalkeeper = player.position === "goalkeeper";

  const initials = player.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleFormSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      await onSubmit(player.id, {
        matchId,
        playerId: player.id,
        userId,
        position: player.position,
        minutesPlayed: values.minutesPlayed,
        goals: values.goals,
        assists: values.assists,
        yellowCards: values.yellowCards,
        redCards: values.redCards,
        ...(isGoalkeeper && {
          cleanSheet: values.cleanSheet,
          saves: values.saves,
        }),
        rating: values.rating,
        isMVP: values.isMVP,
        notes: values.notes || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="bg-card border border-border rounded-xl p-4 space-y-3"
    >
      {/* Player header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={player.photoURL} />
            <AvatarFallback className="text-xs font-display">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{player.displayName}</p>
            <p className="text-xs text-muted-foreground">
              {positionLabels[player.position]}
              {player.jerseyNumber ? ` · #${player.jerseyNumber}` : ""}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setValue("isMVP", !isMVP)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
            isMVP
              ? "bg-primary text-primary-foreground"
              : "bg-muted/60 text-muted-foreground hover:bg-muted"
          }`}
        >
          <Star className="h-3 w-3" />
          MVP
        </button>
      </div>

      {/* Core stats grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">Minuty</Label>
          <Input
            type="number"
            min={0}
            max={120}
            {...register("minutesPlayed", { valueAsNumber: true })}
            className="h-8 text-center text-sm font-display font-bold"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">Góly</Label>
          <Input
            type="number"
            min={0}
            {...register("goals", { valueAsNumber: true })}
            className="h-8 text-center text-sm font-display font-bold"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">Asistence</Label>
          <Input
            type="number"
            min={0}
            {...register("assists", { valueAsNumber: true })}
            className="h-8 text-center text-sm font-display font-bold"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">ŽK</Label>
          <Input
            type="number"
            min={0}
            max={2}
            {...register("yellowCards", { valueAsNumber: true })}
            className="h-8 text-center text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">ČK</Label>
          <Input
            type="number"
            min={0}
            max={1}
            {...register("redCards", { valueAsNumber: true })}
            className="h-8 text-center text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">Hodnocení (1–10)</Label>
          <Input
            type="number"
            min={1}
            max={10}
            step={0.5}
            {...register("rating", { valueAsNumber: true })}
            className="h-8 text-center text-sm font-display font-bold"
          />
        </div>
      </div>

      {/* Goalkeeper extras */}
      {isGoalkeeper && (
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border">
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Zákroky</Label>
            <Input
              type="number"
              min={0}
              {...register("saves", { valueAsNumber: true })}
              className="h-8 text-center text-sm font-display font-bold"
            />
          </div>
          <div className="flex items-center gap-2 pt-5">
            <Switch
              id={`cleanSheet-${player.id}`}
              checked={cleanSheet}
              onCheckedChange={(v) => setValue("cleanSheet", v)}
            />
            <Label
              htmlFor={`cleanSheet-${player.id}`}
              className="text-xs cursor-pointer"
            >
              Čisté konto
            </Label>
          </div>
        </div>
      )}

      <Button type="submit" size="sm" className="w-full" disabled={saving}>
        {saving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
        {existingStats ? "Aktualizovat" : "Uložit statistiky"}
      </Button>
    </form>
  );
}
