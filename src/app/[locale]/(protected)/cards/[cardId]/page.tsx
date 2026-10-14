"use client";

import { useEffect, useRef, useState } from "react";
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
  Sparkles,
  Download,
  Loader2,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
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
import { useShare } from "@/hooks/use-share";
import type { Card, Player } from "@/types";
import toast from "react-hot-toast";

function DownloadCardButton({ card, captureNode }: { card: Card; captureNode: () => HTMLElement | null }) {
  const { share, sharing } = useShare({ card, captureNode });
  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5"
      disabled={sharing}
      onClick={() => share("download")}
    >
      {sharing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
      Stáhnout PNG
    </Button>
  );
}

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
  const [deleteOpen, setDeleteOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !cardId) return;
    // Always refetch: the store copy may predate e.g. a newly uploaded player photo.
    getCardDoc(cardId)
      .then(async (c) => {
        if (!c) return;
        setCard(c);
        setPlayer(await getPlayerDoc(user.uid, c.playerId));
      })
      .catch((err) => console.warn("[CardDetail]", err))
      .finally(() => setLoading(false));
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
    try {
      await deleteCard(card.id);
      removeCard(card.id);
      toast.success("Kartička smazána.");
      router.push(`/${locale}/cards`);
    } catch (err) {
      console.warn("[CardDetail] delete", err);
      toast.error("Kartičku se nepodařilo smazat.");
    }
  };

  const handleShare = async () => {
    if (!card) return;
    const url = `${window.location.origin}/${locale}/card/${card.shareSlug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Fotbalová kartička", url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Odkaz zkopírován!");
      }
      if (!card.isPublic) {
        toast("Kartička je soukromá — odkaz začne fungovat až ji zveřejníte.", { icon: "🔒" });
      }
    } catch (err) {
      if ((err as { name?: string }).name !== "AbortError") {
        toast.error("Sdílení se nepodařilo.");
      }
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
          <Link href={`/${locale}/studio?cardId=${card.id}`} title="AI Studio">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Sparkles className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/${locale}/cards/${card.id}/edit`}>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-destructive hover:text-destructive"
            onClick={() => setDeleteOpen(true)}
            title="Smazat kartičku"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Smazat kartičku?</AlertDialogTitle>
                <AlertDialogDescription>
                  Kartička se trvale smaže včetně všech AI úprav fotky, příběhu a sdíleného odkazu.
                  Hráč ani jeho fotka v profilu se nesmažou. Tuto akci nelze vrátit.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Zrušit</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Smazat kartičku
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Card display + meta */}
      <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
        <div className="shrink-0 flex flex-col items-center gap-3">
          <div ref={cardRef} className="inline-block">
            <CardPreview card={card} player={player ?? undefined} size="lg" interactive />
          </div>
          <div className="flex gap-2">
            <DownloadCardButton card={card} captureNode={() => cardRef.current} />
            <Link href={`/${locale}/print?cardId=${card.id}`}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Printer className="h-3.5 w-3.5" />
                Tisk
              </Button>
            </Link>
          </div>
        </div>

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

          {card.aiStory && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">
                Příběh kartičky
              </p>
              <blockquote className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 text-sm leading-relaxed">
                {card.aiStory}
              </blockquote>
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
          <div
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
            <div className="text-left flex-1">
              <label htmlFor="card-public" className="text-sm font-medium">Zveřejnit kartičku</label>
              <p className="text-xs text-muted-foreground">
                {card.isPublic
                  ? "Zapnuto — kartička je dostupná přes sdílený odkaz."
                  : "Vypnuto — kartičku vidíte jen vy. Zapněte pro sdílení odkazem."}
              </p>
            </div>
            <Switch id="card-public" checked={card.isPublic} onCheckedChange={handleTogglePublic} />
          </div>

          {card.isPublic && (
            <Link href={`/${locale}/card/${card.shareSlug}`} target="_blank" className="block">
              <Button variant="outline" size="sm" className="w-full gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" />
                Otevřít veřejnou stránku
              </Button>
            </Link>
          )}

          <div className="pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteOpen(true)}
              className="w-full gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Smazat kartičku
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
