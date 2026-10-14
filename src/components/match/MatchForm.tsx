"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { FormField, RequiredNote, fieldA11y } from "@/components/forms/FormField";
import { intField, toInt, todayISO } from "@/lib/validation";
import { cn } from "@/lib/utils";
import type { Match, MatchResult } from "@/types";
import toast from "react-hot-toast";

const goalsField = (who: string) =>
  intField({
    min: 0,
    max: 99,
    emptyMessage: `Zadejte počet gólů (${who}).`,
    rangeMessage: "Počet gólů musí být celé číslo od 0 do 99.",
  });

const schema = z.object({
  opponent: z
    .string()
    .trim()
    .min(1, "Zadejte název soupeře.")
    .min(2, "Název soupeře musí mít alespoň 2 znaky.")
    .max(60, "Název soupeře může mít nejvýše 60 znaků."),
  date: z
    .string()
    .min(1, "Vyberte datum zápasu.")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Zadejte platné datum.")
    .refine((v) => v <= todayISO(), "Datum nemůže být v budoucnosti — zapisujete odehraný zápas.")
    .refine((v) => v >= "2000-01-01", "Zkontrolujte prosím rok zápasu."),
  venue: z.string().trim().max(100, "Místo může mít nejvýše 100 znaků."),
  isHome: z.boolean(),
  ourScore: goalsField("váš tým"),
  theirScore: goalsField("soupeř"),
  notes: z.string().trim().max(500, "Poznámka může mít nejvýše 500 znaků."),
});

type FormValues = z.infer<typeof schema>;

const resultLabels: Record<MatchResult, string> = {
  win: "Výhra",
  draw: "Remíza",
  loss: "Prohra",
};

const resultClasses: Record<MatchResult, string> = {
  win: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30",
  draw: "bg-muted/60 text-muted-foreground border-border",
  loss: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
};

function resultOf(ours: number, theirs: number): MatchResult {
  if (ours > theirs) return "win";
  if (ours < theirs) return "loss";
  return "draw";
}

interface MatchFormProps {
  match?: Match;
  onSubmit: (data: Partial<Match>) => Promise<void>;
}

export function MatchForm({ match, onSubmit }: MatchFormProps) {
  const [saving, setSaving] = useState(false);

  // Stored as home/away; edited from the user's team point of view.
  const ourInitial = match ? (match.isHome ? match.homeScore : match.awayScore) : undefined;
  const theirInitial = match ? (match.isHome ? match.awayScore : match.homeScore) : undefined;

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      opponent: match?.opponent ?? "",
      date: match?.date ?? todayISO(),
      venue: match?.venue ?? "",
      isHome: match?.isHome ?? true,
      ourScore: ourInitial?.toString() ?? "",
      theirScore: theirInitial?.toString() ?? "",
      notes: match?.notes ?? "",
    },
  });

  const ourScore = watch("ourScore");
  const theirScore = watch("theirScore");
  const scoresValid =
    /^\d{1,2}$/.test(ourScore.trim()) && /^\d{1,2}$/.test(theirScore.trim());
  const result = scoresValid ? resultOf(toInt(ourScore), toInt(theirScore)) : null;

  const handleFormSubmit = async (values: FormValues) => {
    const ours = toInt(values.ourScore);
    const theirs = toInt(values.theirScore);
    setSaving(true);
    try {
      await onSubmit({
        opponent: values.opponent,
        date: values.date,
        venue: values.venue || undefined,
        isHome: values.isHome,
        homeScore: values.isHome ? ours : theirs,
        awayScore: values.isHome ? theirs : ours,
        result: resultOf(ours, theirs),
        notes: values.notes || undefined,
      });
    } catch (err) {
      console.warn("[MatchForm]", err);
      toast.error("Zápas se nepodařilo uložit. Zkuste to prosím znovu.");
    } finally {
      setSaving(false);
    }
  };

  const onInvalid = () => toast.error("Zkontrolujte prosím zvýrazněná pole.");
  const scoreError = errors.ourScore?.message ?? errors.theirScore?.message;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit, onInvalid)} noValidate className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <FormField id="opponent" label="Soupeř" required error={errors.opponent?.message}>
          <Input
            {...register("opponent")}
            {...fieldA11y("opponent", errors.opponent?.message)}
            placeholder="např. FC Brno U12"
            maxLength={60}
            autoFocus={!match}
          />
        </FormField>

        <FormField id="date" label="Datum zápasu" required error={errors.date?.message}>
          <Input
            type="date"
            max={todayISO()}
            {...register("date")}
            {...fieldA11y("date", errors.date?.message)}
          />
        </FormField>
      </div>

      <FormField id="venue" label="Místo" optional error={errors.venue?.message}>
        <Input
          {...register("venue")}
          {...fieldA11y("venue", errors.venue?.message)}
          placeholder="např. Stadion Evžena Rošického, Praha"
          maxLength={100}
        />
      </FormField>

      <Controller
        control={control}
        name="isHome"
        render={({ field }) => (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-border p-4">
            <div>
              <Label htmlFor="isHome" className="text-sm font-medium">
                Domácí zápas
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Váš tým hrál na domácím hřišti.
              </p>
            </div>
            <Switch id="isHome" checked={field.value} onCheckedChange={field.onChange} />
          </div>
        )}
      />

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">
          Skóre<span className="ml-0.5 text-destructive" aria-hidden>*</span>
        </legend>
        <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-end">
          <div className="space-y-1.5">
            <Label htmlFor="ourScore" className="text-xs text-muted-foreground">
              Váš tým
            </Label>
            <Input
              {...register("ourScore")}
              {...fieldA11y("ourScore", errors.ourScore?.message)}
              inputMode="numeric"
              maxLength={2}
              placeholder="0"
              className="text-center text-xl font-display font-bold h-12"
            />
          </div>
          <div className="text-2xl font-display font-bold text-muted-foreground pb-2">:</div>
          <div className="space-y-1.5">
            <Label htmlFor="theirScore" className="text-xs text-muted-foreground">
              Soupeř
            </Label>
            <Input
              {...register("theirScore")}
              {...fieldA11y("theirScore", errors.theirScore?.message)}
              inputMode="numeric"
              maxLength={2}
              placeholder="0"
              className="text-center text-xl font-display font-bold h-12"
            />
          </div>
        </div>
        {scoreError ? (
          <p role="alert" className="text-xs text-destructive">
            {scoreError}
          </p>
        ) : (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            Výsledek:
            {result ? (
              <span
                className={cn(
                  "px-2 py-0.5 rounded-md border font-semibold",
                  resultClasses[result]
                )}
              >
                {resultLabels[result]}
              </span>
            ) : (
              <span>dopočítá se ze skóre</span>
            )}
          </div>
        )}
      </fieldset>

      <FormField id="notes" label="Poznámky" optional error={errors.notes?.message}>
        <Textarea
          {...register("notes")}
          {...fieldA11y("notes", errors.notes?.message)}
          placeholder="Důležité momenty ze zápasu…"
          rows={3}
          maxLength={500}
        />
      </FormField>

      <RequiredNote />

      <Button type="submit" className="w-full" disabled={saving}>
        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {match ? "Uložit změny" : "Vytvořit zápas"}
      </Button>
    </form>
  );
}
