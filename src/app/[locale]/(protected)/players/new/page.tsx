"use client";

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlayerForm } from "@/components/player/PlayerForm";
import { useAuthStore } from "@/store/authStore";
import { usePlayersStore } from "@/store/appStore";
import { createPlayer, generateUniquePlayerSlug } from "@/lib/firebaseServices";
import type { Player } from "@/types";
import toast from "react-hot-toast";

export default function NewPlayerPage() {
  const { user } = useAuthStore();
  const { addPlayer } = usePlayersStore();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "cs";

  if (!user) return null;

  const handleSubmit = async (data: Partial<Player>) => {
    const slug = await generateUniquePlayerSlug(user.uid, data.displayName ?? "");
    const player = await createPlayer(user.uid, { ...data, slug });
    addPlayer(player);
    toast.success("Hráč byl vytvořen.");
    router.push(`/${locale}/players/${player.id}`);
  };

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/${locale}/players`}>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-display font-bold">Nový hráč</h1>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <PlayerForm userId={user.uid} onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
