"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FormField, RequiredNote, fieldA11y } from "@/components/forms/FormField";
import { intField, todayISO } from "@/lib/validation";
import { PhotoUpload } from "./PhotoUpload";
import type { Player, PlayerPosition } from "@/types";
import toast from "react-hot-toast";

const POSITIONS: PlayerPosition[] = ["goalkeeper", "defender", "midfielder", "forward"];

const positionLabels: Record<PlayerPosition, string> = {
  goalkeeper: "Brankář",
  defender: "Obránce",
  midfielder: "Záložník",
  forward: "Útočník",
};

const OLDEST_BIRTH_YEAR = new Date().getFullYear() - 80;

const schema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Zadejte jméno hráče.")
    .min(2, "Jméno musí mít alespoň 2 znaky.")
    .max(40, "Jméno může mít nejvýše 40 znaků.")
    .regex(
      /^\p{L}[\p{L} .'-]*$/u,
      "Jméno může obsahovat jen písmena, mezery, tečku, pomlčku a apostrof."
    ),
  position: z.enum(POSITIONS, { error: "Vyberte pozici hráče." }),
  jerseyNumber: intField({
    min: 1,
    max: 99,
    rangeMessage: "Číslo dresu musí být celé číslo od 1 do 99.",
  }),
  dateOfBirth: z
    .string()
    .refine((v) => v === "" || !Number.isNaN(Date.parse(v)), "Zadejte platné datum.")
    .refine((v) => v === "" || v <= todayISO(), "Datum narození nemůže být v budoucnosti.")
    .refine(
      (v) => v === "" || Number(v.slice(0, 4)) >= OLDEST_BIRTH_YEAR,
      "Zkontrolujte prosím rok narození."
    ),
  isPublic: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface PlayerFormProps {
  userId: string;
  player?: Player;
  onSubmit: (data: Partial<Player>) => Promise<void>;
}

export function PlayerForm({ userId, player, onSubmit }: PlayerFormProps) {
  const [photoURL, setPhotoURL] = useState<string | undefined>(player?.photoURL);
  const [saving, setSaving] = useState(false);

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
      displayName: player?.displayName ?? "",
      position: player?.position,
      jerseyNumber: player?.jerseyNumber?.toString() ?? "",
      dateOfBirth: player?.dateOfBirth ?? "",
      isPublic: player?.isPublic ?? false,
    },
  });

  const displayName = watch("displayName");

  const handleFormSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      await onSubmit({
        displayName: values.displayName,
        position: values.position,
        jerseyNumber: values.jerseyNumber ? Number(values.jerseyNumber) : undefined,
        dateOfBirth: values.dateOfBirth || undefined,
        isPublic: values.isPublic,
        photoURL,
      });
    } catch (err) {
      console.warn("[PlayerForm]", err);
      toast.error("Hráče se nepodařilo uložit. Zkuste to prosím znovu.");
    } finally {
      setSaving(false);
    }
  };

  const onInvalid = () => toast.error("Zkontrolujte prosím zvýrazněná pole.");

  return (
    <form onSubmit={handleSubmit(handleFormSubmit, onInvalid)} noValidate className="space-y-6">
      <div className="flex justify-center">
        <PhotoUpload
          userId={userId}
          currentPhotoURL={photoURL}
          displayName={displayName}
          onUpload={setPhotoURL}
        />
      </div>

      <div className="space-y-5">
        <FormField
          id="displayName"
          label="Jméno a příjmení"
          required
          hint="Zobrazí se na kartičce hráče."
          error={errors.displayName?.message}
        >
          <Input
            {...register("displayName")}
            {...fieldA11y("displayName", errors.displayName?.message, true)}
            placeholder="např. Jan Novák"
            autoComplete="off"
            maxLength={40}
            autoFocus={!player}
          />
        </FormField>

        <FormField
          id="position"
          label="Pozice"
          required
          hint="Podle pozice se počítají statistiky a styl kartičky."
          error={errors.position?.message}
        >
          <Controller
            control={control}
            name="position"
            render={({ field }) => (
              <Select
                value={field.value ?? null}
                onValueChange={(v) => {
                  field.onChange(v);
                  field.onBlur();
                }}
              >
                <SelectTrigger
                  className="w-full"
                  onBlur={field.onBlur}
                  {...fieldA11y("position", errors.position?.message, true)}
                >
                  <SelectValue>
                    {(value: PlayerPosition | null) =>
                      value ? positionLabels[value] : "Vyberte pozici"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {POSITIONS.map((pos) => (
                    <SelectItem key={pos} value={pos}>
                      {positionLabels[pos]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormField
            id="jerseyNumber"
            label="Číslo dresu"
            optional
            error={errors.jerseyNumber?.message}
          >
            <Input
              {...register("jerseyNumber")}
              {...fieldA11y("jerseyNumber", errors.jerseyNumber?.message)}
              inputMode="numeric"
              placeholder="1–99"
              maxLength={2}
            />
          </FormField>

          <FormField
            id="dateOfBirth"
            label="Datum narození"
            optional
            error={errors.dateOfBirth?.message}
          >
            <Input
              type="date"
              max={todayISO()}
              {...register("dateOfBirth")}
              {...fieldA11y("dateOfBirth", errors.dateOfBirth?.message)}
            />
          </FormField>
        </div>

        <Controller
          control={control}
          name="isPublic"
          render={({ field }) => (
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border p-4">
              <div>
                <Label htmlFor="isPublic" className="text-sm font-medium">
                  Veřejný profil
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Profil uvidí kdokoli s odkazem. U dětí doporučujeme zapnout jen se souhlasem
                  rodiče.
                </p>
              </div>
              <Switch id="isPublic" checked={field.value} onCheckedChange={field.onChange} />
            </div>
          )}
        />
      </div>

      <RequiredNote />

      <Button type="submit" className="w-full" disabled={saving}>
        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {player ? "Uložit změny" : "Vytvořit hráče"}
      </Button>
    </form>
  );
}
