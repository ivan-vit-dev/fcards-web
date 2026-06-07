"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CardGeneratorWizard } from "@/components/card/CardGeneratorWizard";
import { useAuthStore } from "@/store/authStore";
import {
  usePlayersStore,
  useTeamsStore,
  useMatchesStore,
  useCardsStore,
} from "@/store/appStore";
import {
  getPlayers,
  getTeams,
  getTemplates,
  createCard,
  updateUserDoc,
} from "@/lib/firebaseServices";
import { canGenerateCard } from "@/lib/cardEngine";
import { UpgradeDialog } from "@/components/subscription/UpgradeDialog";
import { getUpgradeReason } from "@/lib/subscriptionEngine";
import type { Card, Template, Match } from "@/types";
import toast from "react-hot-toast";

export default function NewCardPage() {
  const { user } = useAuthStore();
  const { players, setPlayers } = usePlayersStore();
  const { teams, setTeams } = useTeamsStore();
  const { matches } = useMatchesStore();
  const { addCard } = useCardsStore();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "cs";

  const [templates, setTemplates] = useState<Template[]>([]);
  const [allMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getPlayers(user.uid).then(setPlayers),
      getTeams(user.uid).then(setTeams),
      getTemplates().then(setTemplates),
    ]).finally(() => setLoading(false));
  }, [user, setPlayers, setTeams]);

  // Combine store matches with any loaded
  const combinedMatches = [...matches, ...allMatches.filter(
    (m) => !matches.find((sm) => sm.id === m.id)
  )];

  if (!user) return null;

  if (!canGenerateCard(user)) {
    return (
      <>
        <div className="max-w-lg text-center py-12 space-y-4">
          <p className="text-xl font-display font-bold">Limit dosažen</p>
          <p className="text-sm text-muted-foreground">
            {getUpgradeReason(user.subscriptionTier, "generate")}
          </p>
          <Button onClick={() => setUpgradeOpen(true)}>Zobrazit plány</Button>
        </div>
        <UpgradeDialog
          open={upgradeOpen}
          onOpenChange={setUpgradeOpen}
          reason={getUpgradeReason(user.subscriptionTier, "generate")}
          currentTier={user.subscriptionTier}
        />
      </>
    );
  }

  if (loading) {
    return (
      <div className="max-w-2xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 rounded-lg" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="max-w-lg text-center py-12 space-y-3">
        <p className="text-lg font-display font-bold">Nejprve přidejte hráče</p>
        <p className="text-sm text-muted-foreground">
          Před vytvořením kartičky je nutné přidat alespoň jednoho hráče.
        </p>
        <Link href={`/${locale}/players/new`}>
          <Button>Přidat hráče</Button>
        </Link>
      </div>
    );
  }

  const handleGenerate = async (draft: Partial<Card>) => {
    if (!user) return;
    const card = await createCard({ ...draft, userId: user.uid });
    addCard(card);
    // Increment monthly counter
    await updateUserDoc(user.uid, {
      cardsGeneratedThisMonth: (user.cardsGeneratedThisMonth ?? 0) + 1,
    });
    toast.success("Kartička vytvořena!");
    router.push(`/${locale}/cards/${card.id}`);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/${locale}/cards`}>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-display font-bold">Nová kartička</h1>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <CardGeneratorWizard
          userId={user.uid}
          players={players}
          teams={teams}
          matches={combinedMatches}
          templates={templates}
          onGenerate={handleGenerate}
        />
      </div>
    </div>
  );
}
