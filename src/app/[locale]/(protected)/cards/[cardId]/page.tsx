"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Share2,
  Trash2,
  Pencil,
  Globe,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CardPreview } from "@/components/card/CardPreview";
import { RarityBadge } from "@/components/card/RarityBadge";
import { useAuthStore } from "@/store/authStore";
import { useCardsStore, usePlayersStore } from "@/store/appStore";
import {
  getCardDoc,
  updateCard,
  deleteCard,
  getPlayerDoc,
} from "@/lib/firebaseServices";
import { CARD_TYPE_LABELS } from "@/lib/cardEngine";
import type { Card, Player } from "@/types";
import toast from "react-hot-toast";

export default function CardDetailPage() {
  const { user } = useAuthStore();
  const { cards, updateCard: updateStore, removeCard } = useCardsStore();
  const { players } = usePlayersStore();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "cs";
  const cardId = params?.cardId as string;

  const [card, setCard] = useState<Card | null>(
    cards.find((c) => c.id === cardId) ?? null
  );
  const [player, setPlayer] = useState<Player | null>(
    card ? (players.find((p) => p.id === card.playerId) ?? null) : null
  );
  const [loading, setLoading] = useState(!card);

  useEffect(() => {
    if (!user || !cardId) return;
    if (card && player) return;
    getCardDoc(cardId).then(async (c) => {
      if (!c) { setLoading(false); return; }
      setCard(c);
      const p = await getPlayerDoc(user.uid, c.playerId);
      setPlayer(p);
      setLoading(false);
    });
  }, [user, cardId]);

  const handleTogglePublic = async () => {
    if (!card || !user) return;
    const updated = { isPublic: !card.isPublic };
    await updateCard(card.id, updated);
    setCard((c) => c ? { ...c, ...updated } : c);
    updateStore(card.id, updated);
    toast.success(updated.isPublic ? "Kartička je nyní veřejná." : "Kartička je skrytá.");
  };

  const handleDelete = async () => {
    if (!card) return;
    await deleteCard(card.id);
    removeCard(card.id);
    toast.success("Kartička smazána.");
    router.push(`/${locale}/cards`);
  };

  const handleShare = async () => {
    if (!card) return;
    const url = `${window.location.origin}/${locale}/card/${card.shareSlug}`;
    if (navigator.share) {
      await navigator.share({ title: "Fotbalová kartička", url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Odkaz zkopírován!");
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-6">
          <Skeleton className="w-[210px] h-[294px] rounded-xl shrink-0" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="max-w-lg text-center py-12 space-y-3">
        <p className="text-muted-foreground">Kartička nenalezena.</p>
        <Link href={`/${locale}/cards`}>
          <Button variant="outline" size="sm">Zpět na kartičky</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/cards`}>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-display font-bold truncate">
            {player?.displayName ?? "Kartička"}
          </h1>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4" />
          </Button>
          {card.isPublic && (
            <Link
              href={`/${locale}/card/${card.shareSlug}`}
              target="_blank"
            >
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
          )}
          <Link href={`/${locale}/cards/${card.id}/edit`}>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Smazat kartičku?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tato akce je nevratná. Kartička bude trvale smazána.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Zrušit</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Smazat
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Card display + meta */}
      <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
        <CardPreview
          card={card}
          player={player ?? undefined}
          size="lg"
          className="shrink-0"
        />

        <div className="space-y-4 flex-1 w-full">
          <div className="space-y-2">
            <RarityBadge rarity={card.rarity} />
            <p className="text-sm text-muted-foreground">
              {CARD_TYPE_LABELS[card.cardType]}
              {card.season ? ` · ${card.season}` : ""}
            </p>
          </div>

          {/* Stats */}
          {card.cardStats && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">
                Statistiky
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Góly", value: card.cardStats.goals },
                  { label: "Asistence", value: card.cardStats.assists },
                  { label: "Hodnocení", value: card.cardStats.rating },
                ]
                  .filter((s) => s.value !== undefined)
                  .map(({ label, value }) => (
                    <div
                      key={label}
                      className="bg-muted/40 rounded-xl p-3 text-center"
                    >
                      <p className="text-lg font-display font-bold">{value}</p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Counters */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-muted/40 rounded-xl p-3 text-center">
              <p className="text-lg font-display font-bold">{card.shareCount}</p>
              <p className="text-xs text-muted-foreground">Sdílení</p>
            </div>
            <div className="bg-muted/40 rounded-xl p-3 text-center">
              <p className="text-lg font-display font-bold">{card.printCount}</p>
              <p className="text-xs text-muted-foreground">Tisky</p>
            </div>
          </div>

          {/* Visibility toggle */}
          <button
            onClick={handleTogglePublic}
            className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-colors ${
              card.isPublic
                ? "border-primary/30 bg-primary/5"
                : "border-border hover:border-primary/20"
            }`}
          >
            {card.isPublic ? (
              <Globe className="h-4 w-4 text-primary shrink-0" />
            ) : (
              <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <div className="text-left">
              <p className="text-sm font-medium">
                {card.isPublic ? "Veřejná kartička" : "Soukromá kartička"}
              </p>
              <p className="text-xs text-muted-foreground">
                {card.isPublic
                  ? "Kartička je dostupná přes sdílený odkaz"
                  : "Pouze vy vidíte tuto kartičku"}
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
