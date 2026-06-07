"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  ImageOff,
  Sparkles,
  PersonStanding,
  Landmark,
  BookOpen,
  Palette,
  Image,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BackgroundRemover } from "@/components/studio/BackgroundRemover";
import { StyleTransferPanel } from "@/components/studio/StyleTransferPanel";
import { UpgradeDialog } from "@/components/subscription/UpgradeDialog";
import { useAIGeneration } from "@/hooks/use-ai-generation";
import { AIProgressIndicator } from "@/components/studio/AIProgressIndicator";
import { useAuthStore } from "@/store/authStore";
import { canUseAI, getUpgradeReason } from "@/lib/subscriptionEngine";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

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
    descriptionCs: "GPT-4o-mini napíše inspirativní popis hráče v češtině.",
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

const TEMP_CARD_ID = "demo-card";

export default function StudioPage() {
  const params = useParams();
  const _locale = (params?.locale as string) ?? "cs";
  const { user } = useAuthStore();
  const [activeFeature, setActiveFeature] = useState<FeatureId | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const { status, isRunning, callFunction } = useAIGeneration();

  const aiAllowed = canUseAI(
    user?.subscriptionTier ?? "free",
    user?.aiCreditsUsedThisMonth ?? 0
  );

  const openFeature = (feat: Feature) => {
    if (!feat.available) return;
    if (feat.tier === "premium" && !aiAllowed) {
      setUpgradeOpen(true);
      return;
    }
    setActiveFeature(feat.id);
  };

  const feature = FEATURES.find((f) => f.id === activeFeature);

  const handleEnhanceFace = async () => {
    toast("Nahrajte nejprve fotografii přes Odstranění pozadí.", { icon: "ℹ️" });
  };

  const handleActionPose = async () => {
    await callFunction(
      "generateActionPose",
      { cardId: TEMP_CARD_ID, playerName: "Hráč", position: "forward" },
      TEMP_CARD_ID
    );
  };

  const handleStadium = async (style: string) => {
    await callFunction(
      "generateStadium",
      { cardId: TEMP_CARD_ID, stadiumStyle: style },
      TEMP_CARD_ID
    );
  };

  const handleCardStory = async () => {
    await callFunction(
      "generateCardStory",
      { cardId: TEMP_CARD_ID, playerName: "Hráč", position: "forward", goals: 10, assists: 5, rating: 8 },
      TEMP_CARD_ID
    );
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold">AI Studio</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Vylepšete své kartičky pomocí umělé inteligence
        </p>
      </div>

      {/* Feature grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEATURES.map((feat) => (
          <button
            key={feat.id}
            onClick={() => openFeature(feat)}
            disabled={!feat.available}
            className={cn(
              "group text-left rounded-2xl border p-5 space-y-3 transition-all duration-200",
              feat.available
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
                {feat.available && (
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
        ))}
      </div>

      {/* Upgrade gate */}
      <UpgradeDialog
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        reason={getUpgradeReason(user?.subscriptionTier ?? "free", "ai")}
        currentTier={user?.subscriptionTier ?? "free"}
      />

      {/* Feature dialog */}
      <Dialog open={activeFeature !== null} onOpenChange={(open) => !open && setActiveFeature(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {feature && <feature.icon className="h-5 w-5 text-primary" />}
              {feature?.titleCs}
            </DialogTitle>
          </DialogHeader>

          <div className="mt-2">
            {activeFeature === "remove-bg" && (
              <BackgroundRemover
                cardId={TEMP_CARD_ID}
                onComplete={(_url) => {
                  toast.success("Pozadí odstraněno!");
                  setActiveFeature(null);
                }}
              />
            )}

            {activeFeature === "style-transfer" && (
              <StyleTransferPanel
                cardId={TEMP_CARD_ID}
                onComplete={(_url) => {
                  toast.success("Styl aplikován!");
                  setActiveFeature(null);
                }}
              />
            )}

            {activeFeature === "enhance-face" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Nahrajte fotografii přes &ldquo;Odstranění pozadí&rdquo; a poté spusťte vylepšení.
                </p>
                {isRunning ? (
                  <div className="flex justify-center py-8">
                    <AIProgressIndicator status={status} />
                  </div>
                ) : (
                  <Button className="w-full" onClick={handleEnhanceFace}>
                    Vylepšit tvář
                  </Button>
                )}
              </div>
            )}

            {activeFeature === "action-pose" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  AI vygeneruje dynamickou fotbalovou pózu pro hráče.
                </p>
                {isRunning ? (
                  <div className="flex justify-center py-8">
                    <AIProgressIndicator status={status} />
                  </div>
                ) : (
                  <Button className="w-full" onClick={handleActionPose}>
                    Generovat pózu
                  </Button>
                )}
              </div>
            )}

            {activeFeature === "stadium" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Vyber styl stadionu:</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "night", label: "Noční zápas" },
                    { value: "sunset", label: "Západ slunce" },
                    { value: "champions", label: "Liga mistrů" },
                    { value: "empty", label: "Dramatický" },
                  ].map((s) => (
                    <Button
                      key={s.value}
                      variant="outline"
                      disabled={isRunning}
                      onClick={() => handleStadium(s.value)}
                    >
                      {s.label}
                    </Button>
                  ))}
                </div>
                {isRunning && (
                  <div className="flex justify-center py-4">
                    <AIProgressIndicator status={status} />
                  </div>
                )}
              </div>
            )}

            {activeFeature === "card-story" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  GPT-4o-mini napíše inspirativní popis hráče v češtině na základě jeho statistik.
                </p>
                {isRunning ? (
                  <div className="flex justify-center py-8">
                    <AIProgressIndicator status={status} />
                  </div>
                ) : (
                  <Button className="w-full" onClick={handleCardStory}>
                    Vygenerovat příběh
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
