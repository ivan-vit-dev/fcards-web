"use client";

import { useState, useRef, useCallback } from "react";
import { duplicateCard, updateCard } from "@/lib/firebaseServices";
import { exportCardPNG } from "@/lib/cardExport";
import { resolveDesign, type Preset } from "@/lib/cardDesign";
import type { Card, CardBadges, CardDesign, Player, Rarity, CardStats } from "@/types";
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
  const updateIdentity = useCallback(
    (patch: Pick<Card, "nationality" | "team">) => update(patch),
    [update]
  );
  const updateSeason = useCallback((season: string) => update({ season }), [update]);
  const updateBadges = useCallback((badges: CardBadges) => update({ badges }), [update]);

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

  // The fields the editor changes — saved onto this card, or onto a new copy.
  const edits = useCallback(
    (): Partial<Card> => ({
      rarity: card.rarity,
      cardStats: card.cardStats,
      season: card.season,
      templateId: card.templateId,
      design: card.design,
      nationality: card.nationality,
      team: card.team,
      badges: card.badges,
    }),
    [card]
  );

  /** Saves the edits as a brand-new card; the card being edited stays untouched. */
  const saveAsNew = useCallback(async (): Promise<Card | null> => {
    setIsSaving(true);
    try {
      const created = await duplicateCard(card.id, edits());
      toast.success("Uloženo jako nová kartička. Původní zůstala beze změn.");
      return created;
    } catch (err) {
      if ((err as { code?: string }).code === "functions/resource-exhausted") {
        toast.error("Tento měsíc už nemůžete vytvořit další kartičku.");
      } else {
        console.warn("[useCardEditor] saveAsNew", err);
        toast.error("Kopii se nepodařilo uložit.");
      }
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [card.id, edits]);

  const save = useCallback(async () => {
    setIsSaving(true);
    try {
      await updateCard(card.id, edits());
      setIsDirty(false);
      toast.success("Kartička uložena.");
    } catch (err) {
      console.warn("[useCardEditor] save", err);
      toast.error("Chyba při ukládání.");
    } finally {
      setIsSaving(false);
    }
  }, [card.id, edits]);

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
    updateIdentity,
    updateBadges,
    updateStat,
    updateSeason,
    applyPreset,
    updateDesign,
    save,
    saveAsNew,
    exportPNG,
  };
}
