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
  useCardsStore,
} from "@/store/appStore";
import {
  getPlayers,
  getTeams,
  getMatches,
  createCard,
  updateUserDoc,
} from "@/lib/firebaseServices";
import { canGenerateCard } from "@/lib/cardEngine";
import { UpgradeDialog } from "@/components/subscription/UpgradeDialog";
import { useSyncProgress } from "@/hooks/use-progress";
import { currentMonth, getCardsGenerated, getUpgradeReason } from "@/lib/subscriptionEngine";
import type { Card, Match } from "@/types";
import toast from "react-hot-toast";

export default function NewCardPage() {
  const { user, setUser } = useAuthStore();
  const syncProgress = useSyncProgress();
  const { players, setPlayers } = usePlayersStore();
  const { setTeams } = useTeamsStore();
  const { addCard } = useCardsStore();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "cs";

  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getPlayers(user.uid).then(setPlayers),
      getTeams(user.uid).then(async (userTeams) => {
        setTeams(userTeams);
        const perTeam = await Promise.all(userTeams.map((t) => getMatches(t.id)));
        setMatches(perTeam.flat());
      }),
    ])
      .catch((err) => {
        console.warn("[NewCardPage]", err);
        toast.error("Nepodařilo se načíst data pro kartičku.");
      })
      .finally(() => setLoading(false));
  }, [user, setPlayers, setTeams]);

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
    try {
      const card = await createCard({ ...draft, userId: user.uid });
      addCard(card);
      const counter = {
        cardsMonth: currentMonth(),
        cardsGeneratedThisMonth: getCardsGenerated(user) + 1,
      };
      await updateUserDoc(user.uid, counter);
      setUser({ ...user, ...counter });
      void syncProgress();
      toast.success("Kartička vytvořena!");
      router.push(`/${locale}/cards/${card.id}`);
    } catch (err) {
      console.warn("[NewCardPage] createCard", err);
      toast.error("Kartičku se nepodařilo vytvořit. Zkuste to prosím znovu.");
    }
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
          userTier={user.subscriptionTier}
          isAdmin={user.role === "superAdmin"}
          locale={locale}
          players={players}
          matches={matches}
          onGenerate={handleGenerate}
        />
      </div>
    </div>
  );
}
