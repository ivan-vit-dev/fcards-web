"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  ImageOff,
  Sparkles,
  PersonStanding,
  Landmark,
  BookOpen,
  Palette,
  Image,
  ChevronRight,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BackgroundRemover } from "@/components/studio/BackgroundRemover";
import { StyleTransferPanel } from "@/components/studio/StyleTransferPanel";
import { AIProgressIndicator } from "@/components/studio/AIProgressIndicator";
import { UpgradeDialog } from "@/components/subscription/UpgradeDialog";
import { CardPreview } from "@/components/card/CardPreview";
import { useAIGeneration } from "@/hooks/use-ai-generation";
import { useAuthStore } from "@/store/authStore";
import { useCardsStore, usePlayersStore } from "@/store/appStore";
import { getCardDoc, getCards, getPlayers, getUserDoc } from "@/lib/firebaseServices";
import {
  canUseAI,
  getAICreditsLeft,
  getAICreditsUsed,
  getUpgradeReason,
} from "@/lib/subscriptionEngine";
import { cn } from "@/lib/utils";

type FeatureId =
  | "remove-bg"
  | "enhance-face"
  | "action-pose"
  | "stadium"
  | "card-story"
  | "style-transfer"
  | "generate-bg";

interface Feature {
  id: FeatureId;
  icon: React.ElementType;
  titleCs: string;
  descriptionCs: string;
  tier: "free" | "premium";
  available: boolean;
}

const FEATURES: Feature[] = [
  {
    id: "remove-bg",
    icon: ImageOff,
    titleCs: "Odstranění pozadí",
    descriptionCs: "AI vymaže pozadí z fotografie hráče.",
    tier: "free",
    available: true,
  },
  {
    id: "style-transfer",
    icon: Palette,
    titleCs: "Styl kartičky",
    descriptionCs: "Přetvořte kartičku do stylu FIFA, Panini, komiks a dalších.",
    tier: "free",
    available: true,
  },
  {
    id: "enhance-face",
    icon: Sparkles,
    titleCs: "Vylepšení tváře",
    descriptionCs: "AI vylepší kvalitu a detaily obličeje na fotografii.",
    tier: "premium",
    available: true,
  },
  {
    id: "action-pose",
    icon: PersonStanding,
    titleCs: "Akční póza",
    descriptionCs: "Generuj dynamickou fotbalovou pózu na základě pozice hráče.",
    tier: "premium",
    available: true,
  },
  {
    id: "stadium",
    icon: Landmark,
    titleCs: "Stadionové pozadí",
    descriptionCs: "AI vytvoří epické stadionové pozadí pro vaši kartičku.",
    tier: "premium",
    available: true,
  },
  {
    id: "card-story",
    icon: BookOpen,
    titleCs: "Příběh kartičky",
    descriptionCs: "AI napíše inspirativní popis hráče v češtině.",
    tier: "premium",
    available: true,
  },
  {
    id: "generate-bg",
    icon: Image,
    titleCs: "Vlastní pozadí",
    descriptionCs: "Vygeneruj unikátní umělecké pozadí pro vaši kartičku.",
    tier: "premium",
    available: false,
  },
];

const STADIUM_STYLES = [
  { value: "night", label: "Noční zápas" },
  { value: "sunset", label: "Západ slunce" },
  { value: "champions", label: "Liga mistrů" },
  { value: "empty", label: "Dramatický" },
];

// useSearchParams needs a Suspense boundary so the page can still be prerendered.
export default function StudioPage() {
  return (
    <Suspense fallback={null}>
      <StudioContent />
    </Suspense>
  );
}

function StudioContent() {
  const params = useParams();
  const locale = (params?.locale as string) ?? "cs";
  const searchParams = useSearchParams();
  const { user, setUser } = useAuthStore();
  const { cards, setCards, updateCard } = useCardsStore();
  const { players, setPlayers } = usePlayersStore();
  const { status, isRunning, imageUrl, story, callFunction } = useAIGeneration();

  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get("cardId"));
  const [activeFeature, setActiveFeature] = useState<FeatureId | null>(null);
  const [ranFeature, setRanFeature] = useState<FeatureId | null>(null);
  const [upgradeReason, setUpgradeReason] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([getCards(user.uid), getPlayers(user.uid)])
      .then(([c, p]) => {
        setCards(c);
        setPlayers(p);
      })
      .finally(() => setLoading(false));
  }, [user, setCards, setPlayers]);

  const selectedCard = cards.find((c) => c.id === selectedId) ?? cards[0] ?? null;
  const player = players.find((p) => p.id === selectedCard?.playerId);
  const sourceImage = selectedCard?.photoUrl ?? player?.photoURL;

  const tier = user?.subscriptionTier ?? "free";
  const isAdmin = user?.role === "superAdmin";
  const premiumAllowed = isAdmin || tier !== "free";
  const creditsLeft = getAICreditsLeft(user);

  // Server is the source of truth for credits; re-read user + card after every job.
  const refreshAfterJob = async (cardId: string) => {
    if (!user) return;
    const [card, freshUser] = await Promise.all([getCardDoc(cardId), getUserDoc(user.uid)]);
    if (card) updateCard(cardId, card);
    if (freshUser) setUser(freshUser);
  };

  const run = async (feature: FeatureId, fn: string, args: Record<string, unknown> = {}) => {
    if (!selectedCard) return;
    setRanFeature(feature);
    try {
      await callFunction(fn, { cardId: selectedCard.id, ...args });
    } catch {
      // useAIGeneration already shows the error toast
    } finally {
      await refreshAfterJob(selectedCard.id);
    }
  };

  const openFeature = (feat: Feature) => {
    if (!feat.available || !selectedCard) return;
    if (!isAdmin && !canUseAI(tier, getAICreditsUsed(user))) {
      setUpgradeReason(getUpgradeReason(tier, "ai"));
      return;
    }
    if (feat.tier === "premium" && !premiumAllowed) {
      setUpgradeReason(getUpgradeReason(tier, "premiumFeature"));
      return;
    }
    setActiveFeature(feat.id);
  };

  const closeFeature = () => {
    setActiveFeature(null);
    if (selectedCard) void refreshAfterJob(selectedCard.id);
  };

  const feature = FEATURES.find((f) => f.id === activeFeature);
  const showResult = ranFeature === activeFeature && status === "done" && !isRunning;

  const progress = (
    <div className="flex justify-center py-8">
      <AIProgressIndicator status={status} />
    </div>
  );

  const imageResult = showResult && imageUrl && (
    <div className="space-y-3">
      <div className="rounded-xl overflow-hidden border border-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="Výsledek" className="w-full max-h-80 object-contain" />
      </div>
      <p className="text-xs text-muted-foreground text-center">Obrázek byl uložen na kartičku.</p>
    </div>
  );

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">AI Studio</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Vylepšete své kartičky pomocí umělé inteligence
          </p>
        </div>
        {user && (
          <div className="text-right shrink-0">
            <p className="text-lg font-display font-bold">
              {isAdmin || creditsLeft === null ? "∞" : creditsLeft}
            </p>
            <p className="text-xs text-muted-foreground">AI kredity</p>
          </div>
        )}
      </div>

      {/* Card picker */}
      {loading ? (
        <div className="flex gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="w-[120px] h-[168px] rounded-xl" />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div className="border border-dashed border-border rounded-2xl p-8 text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            Pro AI Studio potřebujete alespoň jednu kartičku.
          </p>
          <Link href={`/${locale}/cards/new`}>
            <Button size="sm" variant="outline" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Vytvořit kartičku
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Vyberte kartičku
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {cards.map((c) => (
              <CardPreview
                key={c.id}
                card={c}
                player={players.find((p) => p.id === c.playerId)}
                size="sm"
                onClick={() => setSelectedId(c.id)}
                className={cn(
                  "transition-all",
                  c.id === selectedCard?.id
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    : "opacity-60 hover:opacity-100"
                )}
              />
            ))}
          </div>
        </div>
      )}

      {/* Feature grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEATURES.map((feat) => {
          const enabled = feat.available && !!selectedCard;
          return (
            <button
              key={feat.id}
              onClick={() => openFeature(feat)}
              disabled={!enabled}
              className={cn(
                "group text-left rounded-2xl border p-5 space-y-3 transition-all duration-200",
                enabled
                  ? "bg-card border-border hover:border-primary/60 hover:shadow-md cursor-pointer"
                  : "bg-muted/30 border-dashed border-border/60 cursor-not-allowed opacity-60"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <feat.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex items-center gap-1.5">
                  {feat.tier === "premium" && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                      Premium
                    </span>
                  )}
                  {!feat.available && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      Brzy
                    </span>
                  )}
                  {enabled && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  )}
                </div>
              </div>

              <div>
                <p className="font-semibold text-sm">{feat.titleCs}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                  {feat.descriptionCs}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <UpgradeDialog
        open={upgradeReason !== null}
        onOpenChange={(open) => !open && setUpgradeReason(null)}
        reason={upgradeReason ?? undefined}
        currentTier={tier}
      />

      <Dialog open={activeFeature !== null} onOpenChange={(open) => !open && closeFeature()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {feature && <feature.icon className="h-5 w-5 text-primary" />}
              {feature?.titleCs}
            </DialogTitle>
          </DialogHeader>

          {selectedCard && (
            <div className="mt-2">
              {activeFeature === "remove-bg" && (
                <BackgroundRemover cardId={selectedCard.id} onComplete={closeFeature} />
              )}

              {activeFeature === "style-transfer" && (
                <StyleTransferPanel
                  cardId={selectedCard.id}
                  currentImageUrl={sourceImage}
                  premiumAllowed={premiumAllowed}
                  onPremiumRequired={() => {
                    setActiveFeature(null);
                    setUpgradeReason(getUpgradeReason(tier, "premiumStyle"));
                  }}
                  onComplete={closeFeature}
                />
              )}

              {activeFeature === "enhance-face" && (
                <div className="space-y-4">
                  {!sourceImage ? (
                    <p className="text-sm text-muted-foreground">
                      Kartička ani hráč zatím nemají fotku. Nahrajte ji přes „Odstranění pozadí“.
                    </p>
                  ) : isRunning ? (
                    progress
                  ) : (
                    imageResult || (
                      <Button
                        className="w-full"
                        onClick={() => run("enhance-face", "enhanceFace", { imageUrl: sourceImage })}
                      >
                        Vylepšit tvář
                      </Button>
                    )
                  )}
                </div>
              )}

              {activeFeature === "action-pose" && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    AI vygeneruje dynamickou pózu pro pozici hráče
                    {player ? ` ${player.displayName}` : ""}. Obrázek nahradí fotku na kartičce.
                  </p>
                  {isRunning
                    ? progress
                    : imageResult || (
                        <Button
                          className="w-full"
                          onClick={() => run("action-pose", "generateActionPose")}
                        >
                          Generovat pózu
                        </Button>
                      )}
                </div>
              )}

              {activeFeature === "stadium" && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Vyber styl stadionu. Obrázek nahradí fotku na kartičce.
                  </p>
                  {isRunning
                    ? progress
                    : imageResult || (
                        <div className="grid grid-cols-2 gap-2">
                          {STADIUM_STYLES.map((s) => (
                            <Button
                              key={s.value}
                              variant="outline"
                              onClick={() => run("stadium", "generateStadium", { stadiumStyle: s.value })}
                            >
                              {s.label}
                            </Button>
                          ))}
                        </div>
                      )}
                </div>
              )}

              {activeFeature === "card-story" && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    AI napíše inspirativní popis hráče
                    {player ? ` ${player.displayName}` : ""} v češtině na základě statistik
                    kartičky.
                  </p>
                  {isRunning ? (
                    progress
                  ) : showResult && story ? (
                    <div className="space-y-3">
                      <blockquote className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm leading-relaxed">
                        {story}
                      </blockquote>
                      <p className="text-xs text-muted-foreground text-center">
                        Příběh byl uložen na kartičku.
                      </p>
                      <Button variant="outline" className="w-full" onClick={() => run("card-story", "generateCardStory")}>
                        Vygenerovat znovu
                      </Button>
                    </div>
                  ) : (
                    <Button className="w-full" onClick={() => run("card-story", "generateCardStory")}>
                      Vygenerovat příběh
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
