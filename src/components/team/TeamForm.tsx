"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, RequiredNote, fieldA11y } from "@/components/forms/FormField";
import { currentSeason, seasonField } from "@/lib/validation";
import type { Team } from "@/types";
import toast from "react-hot-toast";

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Zadejte název týmu.")
    .min(2, "Název musí mít alespoň 2 znaky.")
    .max(60, "Název může mít nejvýše 60 znaků."),
  season: seasonField,
  ageGroup: z.string().trim().max(30, "Kategorie může mít nejvýše 30 znaků."),
});

type FormValues = z.infer<typeof schema>;

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
    mode: "onTouched",
    defaultValues: {
      name: team?.name ?? "",
      season: team?.season ?? currentSeason(),
      ageGroup: team?.ageGroup ?? "",
    },
  });

  const handleFormSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      await onSubmit({
        name: values.name,
        season: values.season.trim(),
        ageGroup: values.ageGroup || undefined,
      });
    } catch (err) {
      console.warn("[TeamForm]", err);
      toast.error("Tým se nepodařilo uložit. Zkuste to prosím znovu.");
    } finally {
      setSaving(false);
    }
  };

  const onInvalid = () => toast.error("Zkontrolujte prosím zvýrazněná pole.");

  return (
    <form onSubmit={handleSubmit(handleFormSubmit, onInvalid)} noValidate className="space-y-5">
      <FormField
        id="team-name"
        label="Název týmu"
        required
        hint="Pod tímto názvem tým uvidíte v aplikaci i na kartičkách."
        error={errors.name?.message}
      >
        <Input
          {...register("name")}
          {...fieldA11y("team-name", errors.name?.message, true)}
          placeholder="např. FK Slavoj Praha U12"
          maxLength={60}
          autoFocus={!team}
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <FormField
          id="team-season"
          label="Sezóna"
          required
          hint="Ve tvaru rok/rok, např. 2025/26."
          error={errors.season?.message}
        >
          <Input
            {...register("season")}
            {...fieldA11y("team-season", errors.season?.message, true)}
            placeholder="2025/26"
            maxLength={7}
          />
        </FormField>

        <FormField
          id="team-ageGroup"
          label="Věková kategorie"
          optional
          hint="např. U12 nebo Mladší žáci"
          error={errors.ageGroup?.message}
        >
          <Input
            {...register("ageGroup")}
            {...fieldA11y("team-ageGroup", errors.ageGroup?.message, true)}
            placeholder="U12"
            maxLength={30}
          />
        </FormField>
      </div>

      <RequiredNote />

      <Button type="submit" className="w-full" disabled={saving}>
        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {team ? "Uložit změny" : "Vytvořit tým"}
      </Button>
    </form>
  );
}
