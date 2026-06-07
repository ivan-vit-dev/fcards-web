"use client";

import { useState, useRef, useCallback } from "react";
import { updateCard } from "@/lib/firebaseServices";
import { exportCardPNG } from "@/lib/cardExport";
import type { Card, Player, Template, CardEffect, Rarity, CardStats } from "@/types";
import toast from "react-hot-toast";

// Matches the Konva.Stage interface needed for export, without importing Konva itself
interface ExportableStage {
  toBlob(options: { pixelRatio: number }): Promise<Blob>;
}

export function useCardEditor(
  initialCard: Card,
  initialPlayer: Player | null,
  initialTemplate: Template | null
) {
  const [card, setCard] = useState<Card>(initialCard);
  const [player] = useState<Player | null>(initialPlayer);
  const [template, setTemplate] = useState<Template | null>(initialTemplate);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const stageRef = useRef<ExportableStage | null>(null);

  const setStage = useCallback((stage: ExportableStage) => {
    stageRef.current = stage;
  }, []);

  const updateEffect = useCallback((effect: CardEffect) => {
    setCard((c) => ({ ...c, effect }));
    setIsDirty(true);
  }, []);

  const updateRarity = useCallback((rarity: Rarity) => {
    setCard((c) => ({ ...c, rarity }));
    setIsDirty(true);
  }, []);

  const updateStat = useCallback((key: keyof CardStats, value: number) => {
    setCard((c) => ({
      ...c,
      cardStats: { ...c.cardStats, [key]: value },
    }));
    setIsDirty(true);
  }, []);

  const updateSeason = useCallback((season: string) => {
    setCard((c) => ({ ...c, season }));
    setIsDirty(true);
  }, []);

  const updateTemplate = useCallback((t: Template) => {
    setCard((c) => ({ ...c, templateId: t.id }));
    setTemplate(t);
    setIsDirty(true);
  }, []);

  const save = useCallback(async () => {
    setIsSaving(true);
    try {
      await updateCard(card.id, {
        effect: card.effect,
        rarity: card.rarity,
        cardStats: card.cardStats,
        season: card.season,
        templateId: card.templateId,
      });
      setIsDirty(false);
      toast.success("Kartička uložena.");
    } catch {
      toast.error("Chyba při ukládání.");
    } finally {
      setIsSaving(false);
    }
  }, [card]);

  const exportPNG = useCallback(async () => {
    if (!stageRef.current) {
      toast.error("Editor není připraven.");
      return;
    }
    setIsExporting(true);
    try {
      const url = await exportCardPNG(stageRef.current, card.id);
      setCard((c) => ({ ...c, imageUrl: url }));
      toast.success("PNG exportováno a uloženo.");
    } catch {
      toast.error("Chyba při exportu.");
    } finally {
      setIsExporting(false);
    }
  }, [card.id]);

  return {
    card,
    player,
    template,
    isDirty,
    isSaving,
    isExporting,
    setStage,
    updateEffect,
    updateRarity,
    updateStat,
    updateSeason,
    updateTemplate,
    save,
    exportPNG,
  };
}
