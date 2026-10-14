"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EditorToolbar, type EditorTab } from "@/components/editor/EditorToolbar";
import { ContentPanel } from "@/components/editor/ContentPanel";
import { DesignBuilder } from "@/components/editor/DesignBuilder";
import { CardPreview } from "@/components/card/CardPreview";
import { DesignGallery } from "@/components/card/DesignGallery";
import { useCardEditor } from "@/hooks/use-card-editor";
import { useAuthStore } from "@/store/authStore";
import { getCardDoc, getPlayerDoc } from "@/lib/firebaseServices";
import { CUSTOM_DESIGN_TIER, resolveDesign, type Preset } from "@/lib/cardDesign";
import { tierAtLeast } from "@/lib/subscriptionEngine";
import type { Card, Player } from "@/types";

export default function CardEditorPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "cs";
  const cardId = params?.cardId as string;

  const [initialCard, setInitialCard] = useState<Card | null>(null);
  const [initialPlayer, setInitialPlayer] = useState<Player | null>(null);

  useEffect(() => {
    if (!user || !cardId) return;
    (async () => {
      const c = await getCardDoc(cardId);
      if (!c || c.userId !== user.uid) {
        router.replace(`/${locale}/cards`);
        return;
      }
      setInitialPlayer(await getPlayerDoc(user.uid, c.playerId));
      setInitialCard(c);
    })();
  }, [user, cardId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!initialCard) return <EditorSkeleton />;

  return <EditorInner locale={locale} initialCard={initialCard} initialPlayer={initialPlayer} />;
}

// Separate component so useCardEditor only mounts after data is ready
function EditorInner({
  locale,
  initialCard,
  initialPlayer,
}: {
  locale: string;
  initialCard: Card;
  initialPlayer: Player | null;
}) {
  const t = useTranslations("editor");
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<EditorTab>("look");
  const {
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
  } = useCardEditor(initialCard, initialPlayer);

  const tier = user?.subscriptionTier ?? "free";
  const isAdmin = user?.role === "superAdmin";
  const canUsePreset = (p: Preset) => isAdmin || tierAtLeast(tier, p.requiredTier);
  const customLocked = !isAdmin && !tierAtLeast(tier, CUSTOM_DESIGN_TIER);

  return (
    <div className="max-w-6xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Link href={`/${locale}/cards/${card.id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-display font-bold truncate">{t("title")}</h1>
          {isDirty && (
            <span className="text-xs text-muted-foreground shrink-0">· {t("unsavedChanges")}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button variant="outline" size="sm" onClick={exportPNG} disabled={isExporting} className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isExporting ? t("exporting") : t("exportPNG")}</span>
          </Button>
          <Button size="sm" onClick={save} disabled={isSaving || !isDirty} className="gap-1.5">
            <Save className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isSaving ? t("saving") : t("save")}</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
        {/* Live preview — the same renderer as everywhere else in the app */}
        <div className="md:sticky md:top-4 shrink-0 flex justify-center">
          <div ref={cardNodeRef} className="inline-block">
            <CardPreview card={card} player={player ?? undefined} size="lg" interactive />
          </div>
        </div>

        <div className="flex-1 min-w-0 w-full space-y-4">
          <EditorToolbar activeTab={activeTab} onTabChange={setActiveTab} />

          {activeTab === "content" && (
            <ContentPanel
              card={card}
              player={player}
              onUpdateStat={updateStat}
              onUpdateSeason={updateSeason}
              onUpdateRarity={updateRarity}
            />
          )}
          {activeTab === "look" && (
            <DesignGallery
              card={card}
              player={player ?? undefined}
              selectedId={card.templateId}
              canUse={canUsePreset}
              onSelect={applyPreset}
              columns="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
            />
          )}
          {activeTab === "customize" && (
            <DesignBuilder
              card={card}
              player={player ?? undefined}
              design={resolveDesign(card)}
              locked={customLocked}
              locale={locale}
              onChange={updateDesign}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function EditorSkeleton() {
  return (
    <div className="max-w-6xl space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-5 w-40" />
      </div>
      <div className="flex flex-col md:flex-row gap-6">
        <Skeleton className="w-[280px] h-[392px] rounded-xl mx-auto md:mx-0" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
