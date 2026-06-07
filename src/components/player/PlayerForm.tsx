"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
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
import { PhotoUpload } from "./PhotoUpload";
import type { Player, PlayerPosition } from "@/types";

const schema = z.object({
  displayName: z.string().min(2, "Jméno musí mít alespoň 2 znaky."),
  position: z.enum(["goalkeeper", "defender", "midfielder", "forward"]),
  jerseyNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  isPublic: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const positionLabels: Record<PlayerPosition, string> = {
  goalkeeper: "Brankář",
  defender: "Obránce",
  midfielder: "Záložník",
  forward: "Útočník",
};

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
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: player?.displayName ?? "",
      position: player?.position ?? "midfielder",
      jerseyNumber: player?.jerseyNumber?.toString() ?? "",
      dateOfBirth: player?.dateOfBirth ?? "",
      isPublic: player?.isPublic ?? false,
    },
  });

  const isPublic = watch("isPublic");
  const displayName = watch("displayName");

  const handleFormSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      await onSubmit({
        displayName: values.displayName,
        position: values.position,
        jerseyNumber: values.jerseyNumber ? parseInt(values.jerseyNumber, 10) : undefined,
        dateOfBirth: values.dateOfBirth || undefined,
        isPublic: values.isPublic,
        photoURL,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="flex justify-center">
        <PhotoUpload
          userId={userId}
          currentPhotoURL={photoURL}
          displayName={displayName}
          onUpload={setPhotoURL}
        />
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="displayName">Jméno hráče</Label>
          <Input
            id="displayName"
            {...register("displayName")}
            placeholder="Jan Novák"
            autoFocus
          />
          {errors.displayName && (
            <p className="text-xs text-destructive">{errors.displayName.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Pozice</Label>
          <Select
            value={watch("position")}
            onValueChange={(v) => setValue("position", v as PlayerPosition)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["goalkeeper", "defender", "midfielder", "forward"] as PlayerPosition[]).map((pos) => (
                <SelectItem key={pos} value={pos}>
                  {positionLabels[pos]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="jerseyNumber">Číslo dresu</Label>
            <Input
              id="jerseyNumber"
              type="number"
              min={1}
              max={99}
              {...register("jerseyNumber")}
              placeholder="10"
            />
            {errors.jerseyNumber && (
              <p className="text-xs text-destructive">{errors.jerseyNumber.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dateOfBirth">Datum narození</Label>
            <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border p-4">
          <div>
            <p className="text-sm font-medium">Veřejný profil</p>
            <p className="text-xs text-muted-foreground">
              Profil bude viditelný pro ostatní
            </p>
          </div>
          <Switch
            checked={isPublic}
            onCheckedChange={(v) => setValue("isPublic", v)}
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={saving}>
        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {player ? "Uložit změny" : "Vytvořit hráče"}
      </Button>
    </form>
  );
}
