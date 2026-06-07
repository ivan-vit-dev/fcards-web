"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AIProgressIndicator } from "./AIProgressIndicator";
import { useAIGeneration } from "@/hooks/use-ai-generation";
import { cn } from "@/lib/utils";
import type { AIStyle } from "@/types";

interface Props {
  cardId: string;
  currentImageUrl?: string;
  onComplete: (imageUrl: string) => void;
}

const STYLES: { value: AIStyle; labelCs: string; emoji: string; tier: "free" | "premium" }[] = [
  { value: "fifa",       labelCs: "FIFA Ultimate",  emoji: "⚽", tier: "free" },
  { value: "panini",     labelCs: "Panini Retro",   emoji: "📸", tier: "free" },
  { value: "comic",      labelCs: "Komiks",         emoji: "💥", tier: "free" },
  { value: "anime",      labelCs: "Anime",          emoji: "⛩️", tier: "premium" },
  { value: "cartoon",    labelCs: "Kreslený",       emoji: "🎨", tier: "premium" },
  { value: "fantasy",    labelCs: "Fantasy",        emoji: "🔮", tier: "premium" },
  { value: "superhero",  labelCs: "Superhrdina",    emoji: "🦸", tier: "premium" },
];

export function StyleTransferPanel({ cardId, currentImageUrl, onComplete }: Props) {
  const { status, imageUrl, isRunning, callFunction } = useAIGeneration();
  const [selectedStyle, setSelectedStyle] = useState<AIStyle>("fifa");

  const handleApply = async () => {
    if (!currentImageUrl) return;
    await callFunction(
      "applyAIStyle",
      { cardId, imageUrl: currentImageUrl, style: selectedStyle },
      cardId
    );
  };

  if (imageUrl && status === "done") {
    return (
      <div className="space-y-4">
        <div className="rounded-xl overflow-hidden border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="Styled card" className="w-full max-h-80 object-contain" />
        </div>
        <Button className="w-full" onClick={() => onComplete(imageUrl)}>
          Použít tento styl
        </Button>
      </div>
    );
  }

  if (isRunning) {
    return (
      <div className="flex flex-col items-center py-12 gap-4">
        <AIProgressIndicator status={status} />
        <p className="text-xs text-muted-foreground text-center max-w-xs">
          AI aplikuje styl. Může to trvat 60–120 sekund.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {!currentImageUrl && (
        <div className="p-4 bg-muted/60 rounded-xl text-sm text-muted-foreground text-center">
          Nejprve nahrajte fotografii nebo exportujte kartičku.
        </div>
      )}

      {/* Style grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {STYLES.map((s) => (
          <button
            key={s.value}
            onClick={() => setSelectedStyle(s.value)}
            className={cn(
              "flex flex-col items-center gap-1.5 p-3 rounded-xl border text-sm transition-colors",
              selectedStyle === s.value
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
            )}
          >
            <span className="text-2xl">{s.emoji}</span>
            <span className="font-medium text-xs">{s.labelCs}</span>
            {s.tier === "premium" && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-semibold">
                Premium
              </span>
            )}
          </button>
        ))}
      </div>

      <Button
        className="w-full"
        onClick={handleApply}
        disabled={!currentImageUrl || isRunning}
      >
        Aplikovat styl
      </Button>
    </div>
  );
}
