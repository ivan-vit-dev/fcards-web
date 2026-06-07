"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Team } from "@/types";

const schema = z.object({
  name: z.string().min(2, "Název musí mít alespoň 2 znaky."),
  season: z.string().min(4, "Zadejte sezónu (např. 2024/25)."),
  ageGroup: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function defaultSeason(): string {
  const y = new Date().getFullYear();
  return `${y}/${String(y + 1).slice(-2)}`;
}

interface TeamFormProps {
  team?: Team;
  onSubmit: (data: Partial<Team>) => Promise<void>;
}

export function TeamForm({ team, onSubmit }: TeamFormProps) {
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: team?.name ?? "",
      season: team?.season ?? defaultSeason(),
      ageGroup: team?.ageGroup ?? "",
    },
  });

  const handleFormSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      await onSubmit({
        name: values.name,
        season: values.season,
        ageGroup: values.ageGroup || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Název týmu</Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="FK Slavoj Praha U12"
          autoFocus
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="season">Sezóna</Label>
          <Input id="season" {...register("season")} placeholder="2024/25" />
          {errors.season && (
            <p className="text-xs text-destructive">{errors.season.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ageGroup">Věková kategorie</Label>
          <Input id="ageGroup" {...register("ageGroup")} placeholder="U12" />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={saving}>
        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {team ? "Uložit změny" : "Vytvořit tým"}
      </Button>
    </form>
  );
}
