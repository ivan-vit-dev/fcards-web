"use client";

import { useState, useRef, useCallback } from "react";
import { updateCard } from "@/lib/firebaseServices";
import { exportCardPNG } from "@/lib/cardExport";
import { resolveDesign, type Preset } from "@/lib/cardDesign";
import type { Card, CardDesign, Player, Rarity, CardStats } from "@/types";
import toast from "react-hot-toast";

export function useCardEditor(initialCard: Card, initialPlayer: Player | null) {
  // Older cards have no stored design; materialise it so the editor always edits a full design.
  const [card, setCard] = useState<Card>({ ...initialCard, design: resolveDesign(initialCard) });
  const [player] = useState<Player | null>(initialPlayer);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const cardNodeRef = useRef<HTMLDivElement | null>(null);

  const update = useCallback((patch: Partial<Card>) => {
    setCard((c) => ({ ...c, ...patch }));
    setIsDirty(true);
  }, []);

  const updateRarity = useCallback((rarity: Rarity) => update({ rarity }), [update]);
  const updateSeason = useCallback((season: string) => update({ season }), [update]);

  const updateStat = useCallback((key: keyof CardStats, value: number) => {
    setCard((c) => ({ ...c, cardStats: { ...c.cardStats, [key]: value } }));
    setIsDirty(true);
  }, []);

  const applyPreset = useCallback(
    (preset: Preset) => update({ templateId: preset.id, design: preset.design }),
    [update]
  );

  // Any manual tweak turns the design into a custom one.
  const updateDesign = useCallback(
    (patch: Partial<CardDesign>) => {
      setCard((c) => ({ ...c, templateId: "custom", design: { ...resolveDesign(c), ...patch } }));
      setIsDirty(true);
    },
    []
  );

  const save = useCallback(async () => {
    setIsSaving(true);
    try {
      await updateCard(card.id, {
        rarity: card.rarity,
        cardStats: card.cardStats,
        season: card.season,
        templateId: card.templateId,
        design: card.design,
      });
      setIsDirty(false);
      toast.success("Kartička uložena.");
    } catch (err) {
      console.warn("[useCardEditor] save", err);
      toast.error("Chyba při ukládání.");
    } finally {
      setIsSaving(false);
    }
  }, [card]);

  const exportPNG = useCallback(async () => {
    if (!cardNodeRef.current) {
      toast.error("Editor není připraven.");
      return;
    }
    setIsExporting(true);
    try {
      const url = await exportCardPNG(cardNodeRef.current, card.id);
      setCard((c) => ({ ...c, imageUrl: url }));
      toast.success("PNG exportováno a uloženo.");
    } catch (err) {
      console.warn("[useCardEditor] export", err);
      toast.error("Chyba při exportu.");
    } finally {
      setIsExporting(false);
    }
  }, [card.id]);

  return {
    card,
    player,
    isDirty,
    isSaving,
    isExporting,
    cardNodeRef,
    updateRarity,
    updateStat,
    updateSeason,
    applyPreset,
    updateDesign,
    save,
    exportPNG,
  };
}
