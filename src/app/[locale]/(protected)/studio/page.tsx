"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  BookOpen,
  Crop,
  ImageOff,
  Info,
  Landmark,
  Loader2,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UpgradeDialog } from "@/components/subscription/UpgradeDialog";
import { CardPreview } from "@/components/card/CardPreview";
import { useAIGeneration } from "@/hooks/use-ai-generation";
import { useAuthStore } from "@/store/authStore";
import { useCardsStore, usePlayersStore } from "@/store/appStore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PhotoCropper } from "@/components/studio/PhotoCropper";
import {
  addCardPhotoVersion,
  removeCardPhotoVersion,
  getCardDoc,
  getCards,
  getPlayers,
  getUserDoc,
  removeCardBackground,
  updateCard as saveCard,
} from "@/lib/firebaseServices";
import { canUseAI, getAICreditsLeft, getAICreditsUsed, getUpgradeReason } from "@/lib/subscriptionEngine";
import {
  EMOTION_OPTIONS,
  POSE_OPTIONS,
  STADIUM_OPTIONS,
  STYLE_OPTIONS,
  type EditKind,
  type StudioOption,
} from "@/lib/aiStudio";
import { cn } from "@/lib/utils";
import type { PhotoVersion } from "@/types";
import toast from "react-hot-toast";

// useSearchParams needs a Suspense boundary so the page can still be prerendered.
export default function StudioPage() {
  return (
    <Suspense fallback={null}>
      <StudioContent />
    </Suspense>
  );
}

function Step({
  n,
  icon: Icon,
  title,
  hint,
  premium,
  children,
}: {
  n: number;
  icon: React.ElementType;
  title: string;
  hint?: string;
  premium?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-start gap-3">
        <span className="h-7 w-7 shrink-0 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center">
          {n}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary shrink-0" />
            <h2 className="font-semibold text-sm">{title}</h2>
            {premium && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                Premium
              </span>
            )}
          </div>
          {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function OptionGrid({
  options,
  busy,
  running,
  onPick,
}: {
  options: StudioOption[];
  busy: boolean;
  running: string | null;
  onPick: (o: StudioOption) => void;
}) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          disabled={busy}
          onClick={() => onPick(o)}
          className={cn(
            "relative flex flex-col items-center gap-1 rounded-xl border p-2.5 text-center transition-colors",
            "border-border hover:border-primary/50 hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed",
            running === o.id && "border-primary bg-primary/10 opacity-100"
          )}
        >
          {running === o.id ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <span className="text-2xl leading-none" aria-hidden>
              {o.emoji}
            </span>
          )}
          <span className="text-[11px] leading-tight">{o.label}</span>
          {!o.premium && (
            <span className="absolute top-1 right-1 text-[8px] font-semibold text-emerald-600 dark:text-emerald-400">
              ZDARMA
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function StudioContent() {
  const params = useParams();
  const locale = (params?.locale as string) ?? "cs";
  const searchParams = useSearchParams();
  const { user, setUser } = useAuthStore();
  const { cards, setCards, updateCard } = useCardsStore();
  const { players, setPlayers } = usePlayersStore();
  const { isRunning, callFunction } = useAIGeneration();

  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get("cardId"));
  const [running, setRunning] = useState<string | null>(null); // option id or step key in progress
  const [upgradeReason, setUpgradeReason] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [versionToDelete, setVersionToDelete] = useState<PhotoVersion | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([getCards(user.uid), getPlayers(user.uid)])
      .then(([c, p]) => {
        setCards(c);
        setPlayers(p);
      })
      .catch((err) => console.warn("[Studio]", err))
      .finally(() => setLoading(false));
  }, [user, setCards, setPlayers]);

  const card = cards.find((c) => c.id === selectedId) ?? cards[0] ?? null;
  const player = players.find((p) => p.id === card?.playerId);
  const sourceImage = card?.photoUrl ?? player?.photoURL;
  const versions: PhotoVersion[] = card?.photoVersions ?? [];
  const currentVersion = versions.find((v) => v.url === sourceImage);

  const tier = user?.subscriptionTier ?? "free";
  const isAdmin = user?.role === "superAdmin";
  const premiumAllowed = isAdmin || tier !== "free";
  const creditsLeft = getAICreditsLeft(user);
  const busy = isRunning || running !== null;

  // Server is the source of truth for credits and the card; re-read both after every job.
  const refreshAfterJob = async (cardId: string) => {
    if (!user) return;
    const [fresh, freshUser] = await Promise.all([getCardDoc(cardId), getUserDoc(user.uid)]);
    if (fresh) updateCard(cardId, fresh);
    if (freshUser) setUser(freshUser);
  };

  // Gate client-side for a friendly dialog; the Cloud Function enforces the same rules.
  const run = async (key: string, fn: string, args: Record<string, unknown>, premium: boolean) => {
    if (!card || busy) return;
    if (!isAdmin && !canUseAI(tier, getAICreditsUsed(user))) {
      setUpgradeReason(getUpgradeReason(tier, "ai"));
      return;
    }
    if (premium && !premiumAllowed) {
      setUpgradeReason(getUpgradeReason(tier, "premiumFeature"));
      return;
    }
    setRunning(key);
    try {
      await callFunction(fn, { cardId: card.id, ...args });
      toast.success("Hotovo! Výsledek je na kartičce.");
    } catch {
      // useAIGeneration already shows the error toast
    } finally {
      setRunning(null);
      await refreshAfterJob(card.id);
    }
  };

  const editPhoto = (kind: EditKind, o: StudioOption) =>
    sourceImage && run(o.id, "editPhoto", { imageUrl: sourceImage, kind, option: o.id }, o.premium);

  const restoreVersion = async (v: PhotoVersion) => {
    if (!card || busy || v.url === sourceImage) return;
    try {
      const patch = { photoUrl: v.url, photoCutout: !!v.cutout };
      await saveCard(card.id, patch);
      updateCard(card.id, patch);
      toast.success(`Fotka vrácena: ${v.label}`);
    } catch {
      toast.error("Fotku se nepodařilo vrátit.");
    }
  };

  const deleteVersion = async () => {
    if (!card || !versionToDelete) return;
    const label = versionToDelete.label;
    try {
      const patch = await removeCardPhotoVersion(card.id, versionToDelete.url);
      updateCard(card.id, patch);
      toast.success(`Úprava „${label}“ smazána.`);
    } catch (err) {
      console.warn("[Studio] delete version", err);
      toast.error("Úpravu se nepodařilo smazat.");
    } finally {
      setVersionToDelete(null);
    }
  };

  // Crop runs in the browser (no AI, no credit) and joins the photo history like any other step.
  const saveCrop = async (blob: Blob) => {
    if (!card || !user || !sourceImage) return;
    const ext = blob.type === "image/png" ? "png" : "jpg";
    const fileRef = ref(storage, `users/${user.uid}/photos/crop-${card.id}-${Date.now()}.${ext}`);
    await uploadBytes(fileRef, blob, { contentType: blob.type });
    const url = await getDownloadURL(fileRef);
    const patch = await addCardPhotoVersion(card.id, url, "Výřez", sourceImage, !!card.photoCutout);
    updateCard(card.id, patch);
    setCropOpen(false);
    toast.success("Výřez uložen.");
  };

  const removeStadium = async () => {
    if (!card) return;
    await removeCardBackground(card.id);
    updateCard(card.id, { backgroundUrl: undefined });
    toast.success("Stadion byl odebrán.");
  };

  if (loading) {
    return (
      <div className="max-w-6xl space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="flex gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="w-[120px] h-[168px] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="max-w-xl border border-dashed border-border rounded-2xl p-8 text-center space-y-3">
        <p className="text-sm text-muted-foreground">Pro AI Studio potřebujete alespoň jednu kartičku.</p>
        <Link href={`/${locale}/cards/new`}>
          <Button size="sm" variant="outline" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Vytvořit kartičku
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">AI Studio</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Vylepšete fotku hráče — póza, emoce, styl i stadion, s historií každého kroku.
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-display font-bold">{isAdmin || creditsLeft === null ? "∞" : creditsLeft}</p>
          <p className="text-xs text-muted-foreground">AI kredity</p>
        </div>
      </div>

      {/* Card picker */}
      {cards.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
          {cards.map((c) => (
            <CardPreview
              key={c.id}
              card={c}
              player={players.find((p) => p.id === c.playerId)}
              size="sm"
              flat
              onClick={() => !busy && setSelectedId(c.id)}
              className={cn(
                "transition-opacity",
                c.id === card.id ? "ring-2 ring-primary ring-offset-2 ring-offset-background rounded-xl" : "opacity-50 hover:opacity-100"
              )}
            />
          ))}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-start">
        {/* Live card + photo history */}
        <div className="lg:sticky lg:top-4 shrink-0 w-full max-w-[280px] space-y-4">
          <CardPreview card={card} player={player} size="lg" interactive />

          {versions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Historie fotky
                </p>
                {currentVersion && currentVersion !== versions[0] && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    onClick={() => setVersionToDelete(currentVersion)}
                    className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Smazat tuto úpravu
                  </Button>
                )}
              </div>
              <div className="flex gap-2 overflow-x-auto pt-1.5 pb-1">
                {versions.map((v, i) => {
                  const current = v.url === sourceImage;
                  return (
                    <div key={v.url} className="relative shrink-0 w-16">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => restoreVersion(v)}
                        title={current ? `${v.label} (aktuální)` : `Vrátit: ${v.label}`}
                        className={cn("w-16 space-y-1 text-center", busy && "opacity-50 cursor-not-allowed")}
                      >
                        <div
                          className={cn(
                            "h-20 w-16 rounded-lg overflow-hidden border-2 bg-muted",
                            current ? "border-primary" : "border-transparent hover:border-primary/40"
                          )}
                          style={{ backgroundImage: "repeating-conic-gradient(var(--muted) 0 25%, transparent 0 50%)", backgroundSize: "10px 10px" }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={v.url} alt={v.label} className="h-full w-full object-cover object-top" />
                        </div>
                        <p className="text-[10px] leading-tight truncate">{v.label}</p>
                      </button>
                      {i > 0 && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setVersionToDelete(v)}
                          aria-label={`Smazat úpravu ${v.label}`}
                          className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center shadow hover:scale-110 transition-transform disabled:opacity-50"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Klepnutím na verzi ji vrátíte na kartičku, křížkem nepovedenou úpravu smažete. Originál zůstává vždy.
              </p>
            </div>
          )}
        </div>

        {/* Steps */}
        <div className="flex-1 min-w-0 w-full space-y-4">
          {!sourceImage ? (
            <div className="rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4 text-sm">
              Hráč zatím nemá fotku.{" "}
              <Link href={`/${locale}/players/${card.playerId}`} className="text-primary underline">
                Nahrajte ji v profilu hráče
              </Link>{" "}
              a pak se sem vraťte.
            </div>
          ) : (
            <div className="flex gap-2 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <p>
                Postupujte shora dolů: <b>výřez → póza a emoce → styl → tvář → pozadí → stadion</b>. Každá
                AI úprava pracuje s aktuální fotkou na kartičce a stojí 1 AI kredit (výřez je zdarma).
                Nejlepší výsledky dává ostrá fotka, kde je dobře vidět obličej.
              </p>
            </div>
          )}

          <Step
            n={1}
            icon={Crop}
            title="Výřez fotky"
            hint="Z fotky celé postavy udělejte záběr od pasu nahoru — AI pak dostane větší obličej a pracuje mnohem lépe."
          >
            <Button size="sm" disabled={busy || !sourceImage} onClick={() => setCropOpen(true)} className="gap-1.5">
              <Crop className="h-3.5 w-3.5" />
              Oříznout fotku
            </Button>
          </Step>

          <Step n={2} icon={Wand2} title="Póza" premium hint="Hráč zůstane stejný, změní se jen jeho postoj nebo gesto.">
            <OptionGrid options={POSE_OPTIONS} busy={busy || !sourceImage} running={running} onPick={(o) => editPhoto("pose", o)} />
          </Step>

          <Step n={3} icon={Wand2} title="Emoce" premium hint="Změní jen výraz obličeje.">
            <OptionGrid options={EMOTION_OPTIONS} busy={busy || !sourceImage} running={running} onPick={(o) => editPhoto("emotion", o)} />
          </Step>

          <Step n={4} icon={Wand2} title="Styl" hint="Přemaluje fotku do jiného stylu. První tři styly jsou zdarma.">
            <OptionGrid options={STYLE_OPTIONS} busy={busy || !sourceImage} running={running} onPick={(o) => editPhoto("style", o)} />
          </Step>

          <Step
            n={5}
            icon={Sparkles}
            title="Vylepšení tváře"
            premium
            hint="Zaostří a vyčistí obličej, zachová skutečnou podobu. Použijte po póze a emocích — opraví i rozmazání po AI."
          >
            <Button
              size="sm"
              disabled={busy || !sourceImage}
              onClick={() => run("face", "enhanceFace", { imageUrl: sourceImage }, true)}
              className="gap-1.5"
            >
              {running === "face" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Vylepšit tvář
            </Button>
          </Step>

          <Step
            n={6}
            icon={ImageOff}
            title="Odstranění pozadí"
            hint="Nutné pro stadion za hráčem a efekty „Velké číslo“ a „Hráč vystupuje z rámečku“."
          >
            <Button
              size="sm"
              variant="outline"
              disabled={busy || !sourceImage}
              onClick={() => run("bg", "removeBackground", { imageUrl: sourceImage }, false)}
              className="gap-1.5"
            >
              {running === "bg" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageOff className="h-3.5 w-3.5" />}
              Odstranit pozadí
            </Button>
          </Step>

          <Step
            n={7}
            icon={Landmark}
            title="Stadion za hráčem"
            premium
            hint="Vloží se za hráče jako pozadí kartičky. Pokud má fotka ještě původní pozadí, AI ho nejdřív sama odstraní."
          >
            <OptionGrid
              options={STADIUM_OPTIONS}
              busy={busy}
              running={running}
              onPick={(o) => run(o.id, "generateStadium", { stadiumStyle: o.id }, true)}
            />
            {card.backgroundUrl && (
              <Button variant="ghost" size="sm" disabled={busy} onClick={removeStadium} className="text-muted-foreground">
                Odebrat stadion
              </Button>
            )}
          </Step>

          <Step n={8} icon={BookOpen} title="Příběh kartičky" premium hint="AI napíše krátký příběh hráče v češtině podle statistik.">
            {card.aiStory && (
              <blockquote className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm leading-relaxed">
                {card.aiStory}
              </blockquote>
            )}
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => run("story", "generateCardStory", {}, true)}
              className="gap-1.5"
            >
              {running === "story" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BookOpen className="h-3.5 w-3.5" />}
              {card.aiStory ? "Vygenerovat znovu" : "Vygenerovat příběh"}
            </Button>
          </Step>
        </div>
      </div>

      <Dialog open={cropOpen} onOpenChange={(open) => !open && setCropOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Výřez fotky</DialogTitle>
          </DialogHeader>
          {cropOpen && sourceImage && (
            <PhotoCropper
              src={sourceImage}
              transparent={!!card.photoCutout}
              onCancel={() => setCropOpen(false)}
              onCrop={saveCrop}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={versionToDelete !== null} onOpenChange={(open) => !open && setVersionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Smazat úpravu „{versionToDelete?.label}“?</AlertDialogTitle>
            <AlertDialogDescription>
              {versionToDelete?.url === sourceImage
                ? "Je to aktuální fotka na kartičce — kartička se vrátí na předchozí verzi."
                : "Úprava zmizí z historie fotky."}{" "}
              Tuto akci nelze vrátit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušit</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteVersion}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Smazat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UpgradeDialog
        open={upgradeReason !== null}
        onOpenChange={(open) => !open && setUpgradeReason(null)}
        reason={upgradeReason ?? undefined}
        currentTier={tier}
      />
    </div>
  );
}
