"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FormField, fieldA11y } from "@/components/forms/FormField";
import { intField, toInt } from "@/lib/validation";
import { cn } from "@/lib/utils";
import type { Player, PlayerMatchStats } from "@/types";
import toast from "react-hot-toast";

const positionLabels: Record<string, string> = {
  goalkeeper: "Brankář",
  defender: "Obránce",
  midfielder: "Záložník",
  forward: "Útočník",
};

interface MatchContext {
  teamGoals: number;
  conceded: number;
  mvpTakenBy?: string; // name of another player already marked MVP in this match
}

function buildSchema(isGoalkeeper: boolean, ctx: MatchContext) {
  return z
    .object({
      minutesPlayed: intField({
        min: 0,
        max: 120,
        emptyMessage: "Zadejte odehrané minuty.",
        rangeMessage: "Minuty musí být celé číslo od 0 do 120.",
      }),
      goals: intField({
        min: 0,
        max: 30,
        emptyMessage: "Zadejte počet gólů (i 0).",
        rangeMessage: "Góly musí být celé číslo od 0 do 30.",
      }),
      assists: intField({
        min: 0,
        max: 30,
        emptyMessage: "Zadejte počet asistencí (i 0).",
        rangeMessage: "Asistence musí být celé číslo od 0 do 30.",
      }),
      yellowCards: intField({
        min: 0,
        max: 2,
        emptyMessage: "Zadejte počet žlutých karet (i 0).",
        rangeMessage: "Žluté karty: 0, 1 nebo 2.",
      }),
      redCards: intField({
        min: 0,
        max: 1,
        emptyMessage: "Zadejte počet červených karet (i 0).",
        rangeMessage: "Červená karta: 0 nebo 1.",
      }),
      rating: z
        .string()
        .trim()
        .superRefine((value, issue) => {
          if (value === "") {
            issue.addIssue({ code: "custom", message: "Zadejte hodnocení 1–10." });
            return;
          }
          const n = Number(value.replace(",", "."));
          if (Number.isNaN(n) || n < 1 || n > 10 || (n * 2) % 1 !== 0) {
            issue.addIssue({
              code: "custom",
              message: "Hodnocení je číslo 1–10, lze i s půlkou (např. 7,5).",
            });
          }
        }),
      saves: isGoalkeeper
        ? intField({
            min: 0,
            max: 50,
            emptyMessage: "Zadejte počet zákroků (i 0).",
            rangeMessage: "Zákroky musí být celé číslo od 0 do 50.",
          })
        : z.string(),
      cleanSheet: z.boolean(),
      isMVP: z.boolean(),
    })
    .superRefine((v, issue) => {
      const minutes = toInt(v.minutesPlayed);
      const goals = toInt(v.goals);
      const assists = toInt(v.assists);
      if (minutes === 0 && (goals > 0 || assists > 0)) {
        issue.addIssue({
          code: "custom",
          path: ["goals"],
          message: "Hráč, který nenastoupil (0 minut), nemůže mít góly ani asistence.",
        });
      }
      if (goals > ctx.teamGoals) {
        issue.addIssue({
          code: "custom",
          path: ["goals"],
          message: `Tým v zápase vstřelil jen ${ctx.teamGoals} gólů.`,
        });
      }
      if (assists > ctx.teamGoals) {
        issue.addIssue({
          code: "custom",
          path: ["assists"],
          message: `Asistencí nemůže být víc než gólů týmu (${ctx.teamGoals}).`,
        });
      }
      if (v.cleanSheet && ctx.conceded > 0) {
        issue.addIssue({
          code: "custom",
          path: ["cleanSheet"],
          message: `Čisté konto nelze — tým inkasoval ${ctx.conceded}.`,
        });
      }
      if (v.isMVP && ctx.mvpTakenBy) {
        issue.addIssue({
          code: "custom",
          path: ["isMVP"],
          message: `MVP zápasu už je ${ctx.mvpTakenBy}. Nejdřív mu MVP odeberte.`,
        });
      }
    });
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

interface StatsEntryFormProps {
  player: Player;
  matchId: string;
  userId: string;
  existingStats?: PlayerMatchStats;
  match: MatchContext;
  onSubmit: (playerId: string, data: Partial<PlayerMatchStats>) => Promise<void>;
}

export function StatsEntryForm({
  player,
  matchId,
  userId,
  existingStats,
  match,
  onSubmit,
}: StatsEntryFormProps) {
  const [saving, setSaving] = useState(false);
  const isGoalkeeper = player.position === "goalkeeper";
  const fid = (name: string) => `${name}-${player.id}`;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(buildSchema(isGoalkeeper, match)),
    mode: "onTouched",
    defaultValues: {
      minutesPlayed:
        existingStats?.minutesPlayed !== undefined ? String(existingStats.minutesPlayed) : "",
      goals: String(existingStats?.goals ?? 0),
      assists: String(existingStats?.assists ?? 0),
      yellowCards: String(existingStats?.yellowCards ?? 0),
      redCards: String(existingStats?.redCards ?? 0),
      rating: existingStats?.rating !== undefined ? String(existingStats.rating) : "",
      saves: String(existingStats?.saves ?? 0),
      cleanSheet: existingStats?.cleanSheet ?? false,
      isMVP: existingStats?.isMVP ?? false,
    },
  });

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
        minutesPlayed: toInt(values.minutesPlayed),
        goals: toInt(values.goals),
        assists: toInt(values.assists),
        yellowCards: toInt(values.yellowCards),
        redCards: toInt(values.redCards),
        ...(isGoalkeeper && {
          cleanSheet: values.cleanSheet,
          saves: toInt(values.saves),
        }),
        rating: Number(values.rating.replace(",", ".")),
        isMVP: values.isMVP,
      });
      reset(values);
    } catch {
      // the page shows the error toast
    } finally {
      setSaving(false);
    }
  };

  const onInvalid = () =>
    toast.error(`${player.displayName}: zkontrolujte prosím zvýrazněná pole.`);

  const numberInput = (name: keyof FormValues, label: string, max: number) => (
    <FormField id={fid(name)} label={label} error={errors[name]?.message}>
      <Input
        {...register(name)}
        {...fieldA11y(fid(name), errors[name]?.message)}
        inputMode="numeric"
        maxLength={String(max).length}
        className="h-9 text-center font-display font-bold"
      />
    </FormField>
  );

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit, onInvalid)}
      noValidate
      className="bg-card border border-border rounded-xl p-4 space-y-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={player.photoURL} />
            <AvatarFallback className="text-xs font-display">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{player.displayName}</p>
            <p className="text-xs text-muted-foreground">
              {positionLabels[player.position]}
              {player.jerseyNumber ? ` · #${player.jerseyNumber}` : ""}
            </p>
          </div>
        </div>
        {existingStats && !isDirty && (
          <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 shrink-0">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Uloženo
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {numberInput("minutesPlayed", "Odehrané minuty", 120)}
        {numberInput("goals", "Góly", 30)}
        {numberInput("assists", "Asistence", 30)}
        {numberInput("yellowCards", "Žluté karty", 2)}
        {numberInput("redCards", "Červené karty", 1)}
        <FormField id={fid("rating")} label="Hodnocení 1–10" error={errors.rating?.message}>
          <Input
            {...register("rating")}
            {...fieldA11y(fid("rating"), errors.rating?.message)}
            inputMode="decimal"
            placeholder="např. 7,5"
            maxLength={4}
            className="h-9 text-center font-display font-bold"
          />
        </FormField>
      </div>

      {isGoalkeeper && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-border">
          {numberInput("saves", "Zákroky", 50)}
          <Controller
            control={control}
            name="cleanSheet"
            render={({ field }) => (
              <div className="space-y-1.5 sm:col-span-2">
                <div className="flex items-center gap-2 pt-6">
                  <Switch
                    id={fid("cleanSheet")}
                    checked={field.value}
                    onCheckedChange={(v) => {
                      field.onChange(v);
                      field.onBlur();
                    }}
                  />
                  <Label htmlFor={fid("cleanSheet")} className="text-sm cursor-pointer">
                    Čisté konto (neinkasoval)
                  </Label>
                </div>
                {errors.cleanSheet && (
                  <p role="alert" className="text-xs text-destructive">
                    {errors.cleanSheet.message}
                  </p>
                )}
              </div>
            )}
          />
        </div>
      )}

      <Controller
        control={control}
        name="isMVP"
        render={({ field }) => (
          <div className="space-y-1.5">
            <button
              type="button"
              aria-pressed={field.value}
              onClick={() => {
                field.onChange(!field.value);
                field.onBlur();
              }}
              className={cn(
                "w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors",
                field.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:bg-muted/60"
              )}
            >
              <Star className="h-4 w-4" />
              {field.value ? "Nejlepší hráč zápasu (MVP)" : "Označit jako MVP zápasu"}
            </button>
            {errors.isMVP && (
              <p role="alert" className="text-xs text-destructive">
                {errors.isMVP.message}
              </p>
            )}
          </div>
        )}
      />

      <Button type="submit" size="sm" className="w-full" disabled={saving}>
        {saving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
        {existingStats ? "Uložit změny" : "Uložit statistiky"}
      </Button>
    </form>
  );
}
