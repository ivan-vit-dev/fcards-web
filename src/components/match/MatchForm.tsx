"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Match, MatchResult } from "@/types";

const schema = z.object({
  opponent: z.string().min(2, "Zadejte název soupeře."),
  date: z.string().min(1, "Vyberte datum."),
  venue: z.string().optional(),
  homeScore: z.number().int().min(0),
  awayScore: z.number().int().min(0),
  isHome: z.boolean(),
  result: z.enum(["win", "draw", "loss"]),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const resultLabels: Record<MatchResult, string> = {
  win: "Výhra",
  draw: "Remíza",
  loss: "Prohra",
};

interface MatchFormProps {
  match?: Match;
  onSubmit: (data: Partial<Match>) => Promise<void>;
}

export function MatchForm({ match, onSubmit }: MatchFormProps) {
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      opponent: match?.opponent ?? "",
      date: match?.date ?? new Date().toISOString().split("T")[0],
      venue: match?.venue ?? "",
      homeScore: match?.homeScore ?? 0,
      awayScore: match?.awayScore ?? 0,
      isHome: match?.isHome ?? true,
      result: match?.result ?? "win",
      notes: match?.notes ?? "",
    },
  });

  const isHome = watch("isHome");

  const handleFormSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      await onSubmit({
        opponent: values.opponent,
        date: values.date,
        venue: values.venue || undefined,
        homeScore: values.homeScore,
        awayScore: values.awayScore,
        isHome: values.isHome,
        result: values.result,
        notes: values.notes || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="opponent">Soupeř</Label>
          <Input
            id="opponent"
            {...register("opponent")}
            placeholder="FC Brno"
            autoFocus
          />
          {errors.opponent && (
            <p className="text-xs text-destructive">{errors.opponent.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="date">Datum</Label>
          <Input id="date" type="date" {...register("date")} />
          {errors.date && (
            <p className="text-xs text-destructive">{errors.date.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="venue">Místo (nepovinné)</Label>
        <Input
          id="venue"
          {...register("venue")}
          placeholder="Stadion Evžena Rošického, Praha"
        />
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border p-4">
        <div>
          <p className="text-sm font-medium">Domácí zápas</p>
          <p className="text-xs text-muted-foreground">Váš tým hraje na domácím hřišti</p>
        </div>
        <Switch
          checked={isHome}
          onCheckedChange={(v) => setValue("isHome", v)}
        />
      </div>

      <div className="grid grid-cols-3 gap-4 items-end">
        <div className="space-y-1.5">
          <Label htmlFor="homeScore">{isHome ? "Váš tým" : "Soupeř"}</Label>
          <Input
            id="homeScore"
            type="number"
            min={0}
            {...register("homeScore", { valueAsNumber: true })}
            className="text-center text-xl font-display font-bold h-12"
          />
        </div>
        <div className="text-center text-2xl font-display font-bold text-muted-foreground pb-1">
          :
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="awayScore">{isHome ? "Soupeř" : "Váš tým"}</Label>
          <Input
            id="awayScore"
            type="number"
            min={0}
            {...register("awayScore", { valueAsNumber: true })}
            className="text-center text-xl font-display font-bold h-12"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Výsledek</Label>
        <Select
          value={watch("result")}
          onValueChange={(v) => setValue("result", v as MatchResult)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(["win", "draw", "loss"] as MatchResult[]).map((r) => (
              <SelectItem key={r} value={r}>
                {resultLabels[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Poznámky (nepovinné)</Label>
        <Textarea
          id="notes"
          {...register("notes")}
          placeholder="Důležité momenty ze zápasu..."
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full" disabled={saving}>
        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {match ? "Uložit změny" : "Vytvořit zápas"}
      </Button>
    </form>
  );
}
