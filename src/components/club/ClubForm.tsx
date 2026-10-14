"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, RequiredNote, fieldA11y } from "@/components/forms/FormField";
import toast from "react-hot-toast";
import type { Club } from "@/types";

// Accept "fcpraha.cz" as well as "https://fcpraha.cz".
function normalizeWebsite(value: string): string {
  const v = value.trim();
  if (!v) return "";
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

function isValidWebsite(value: string): boolean {
  if (!value) return true;
  if (!URL.canParse(value)) return false;
  const { hostname } = new URL(value);
  return /^[^.\s]+(\.[^.\s]+)+$/.test(hostname);
}

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Zadejte název klubu.")
    .min(2, "Název musí mít alespoň 2 znaky.")
    .max(80, "Název může mít nejvýše 80 znaků."),
  city: z
    .string()
    .trim()
    .max(60, "Město může mít nejvýše 60 znaků.")
    .refine(
      (v) => v === "" || /^\p{L}[\p{L} .'-]*$/u.test(v),
      "Město může obsahovat jen písmena, mezery, tečku a pomlčku."
    ),
  website: z
    .string()
    .refine(
      (v) => isValidWebsite(normalizeWebsite(v)),
      "Zadejte platnou webovou adresu, např. fcpraha.cz."
    ),
});

type FormData = z.infer<typeof schema>;

interface Props {
  initialData?: Partial<Club>;
  onSubmit: (data: Partial<Club>) => Promise<void>;
}

export function ClubForm({ initialData, onSubmit }: Props) {
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      name: initialData?.name ?? "",
      city: initialData?.city ?? "",
      website: initialData?.website ?? "",
    },
  });

  const submit = async (data: FormData) => {
    setSaving(true);
    try {
      await onSubmit({
        name: data.name,
        city: data.city || undefined,
        website: normalizeWebsite(data.website) || undefined,
      });
      toast.success(initialData ? "Klub byl uložen." : "Klub byl vytvořen!");
    } catch (err) {
      console.warn("[ClubForm]", err);
      toast.error("Klub se nepodařilo uložit. Zkuste to prosím znovu.");
    } finally {
      setSaving(false);
    }
  };

  const onInvalid = () => toast.error("Zkontrolujte prosím zvýrazněná pole.");

  return (
    <form onSubmit={handleSubmit(submit, onInvalid)} noValidate className="space-y-5 max-w-md">
      <FormField id="club-name" label="Název klubu" required error={errors.name?.message}>
        <Input
          {...register("name")}
          {...fieldA11y("club-name", errors.name?.message)}
          placeholder="např. FC Praha"
          maxLength={80}
        />
      </FormField>

      <FormField id="club-city" label="Město" optional error={errors.city?.message}>
        <Input
          {...register("city")}
          {...fieldA11y("club-city", errors.city?.message)}
          placeholder="např. Praha"
          maxLength={60}
        />
      </FormField>

      <FormField
        id="club-website"
        label="Web klubu"
        optional
        hint="Stačí napsat adresu, https:// doplníme sami."
        error={errors.website?.message}
      >
        <Input
          {...register("website")}
          {...fieldA11y("club-website", errors.website?.message, true)}
          placeholder="fcpraha.cz"
          inputMode="url"
          autoComplete="url"
        />
      </FormField>

      <RequiredNote />

      <Button type="submit" disabled={saving}>
        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {initialData ? "Uložit změny" : "Vytvořit klub"}
      </Button>
    </form>
  );
}
