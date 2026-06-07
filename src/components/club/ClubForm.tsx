"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";
import type { Club } from "@/types";

const schema = z.object({
  name: z.string().min(2, "Název musí mít alespoň 2 znaky"),
  city: z.string().optional(),
  website: z
    .string()
    .url("Neplatná URL adresa")
    .optional()
    .or(z.literal("")),
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
        website: data.website || undefined,
      });
      toast.success(initialData ? "Klub byl uložen" : "Klub byl vytvořen!");
    } catch {
      toast.error("Nepodařilo se uložit klub");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4 max-w-md">
      <div className="space-y-1.5">
        <Label htmlFor="club-name">Název klubu *</Label>
        <Input
          id="club-name"
          {...register("name")}
          placeholder="FC Praha"
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="club-city">Město</Label>
        <Input
          id="club-city"
          {...register("city")}
          placeholder="Praha"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="club-website">Web klubu</Label>
        <Input
          id="club-website"
          {...register("website")}
          placeholder="https://fcpraha.cz"
          type="url"
        />
        {errors.website && (
          <p className="text-xs text-destructive">{errors.website.message}</p>
        )}
      </div>

      <Button type="submit" disabled={saving}>
        {saving ? "Ukládám…" : initialData ? "Uložit změny" : "Vytvořit klub"}
      </Button>
    </form>
  );
}
