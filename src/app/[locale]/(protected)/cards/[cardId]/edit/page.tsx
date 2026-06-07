"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EditorToolbar, type EditorTab } from "@/components/editor/EditorToolbar";
import { ContentPanel } from "@/components/editor/ContentPanel";
import { DesignPanel } from "@/components/editor/DesignPanel";
import { EffectsPanel } from "@/components/editor/EffectsPanel";
import { useCardEditor } from "@/hooks/use-card-editor";
import { useAuthStore } from "@/store/authStore";
import { getCardDoc, getPlayerDoc, getTemplateDoc } from "@/lib/firebaseServices";
import { STAGE_W, STAGE_H } from "@/components/editor/CardEditorCanvas";
import type { Card, Player, Template } from "@/types";

// Load Konva canvas only on client — it references window during init
const CardEditorCanvas = dynamic(
  () =>
    import("@/components/editor/CardEditorCanvas").then((m) => ({
      default: m.CardEditorCanvas,
    })),
  {
    ssr: false,
    loading: () => (
      <div
        style={{ width: DISPLAY_W, height: Math.round(DISPLAY_W * (STAGE_H / STAGE_W)) }}
        className="rounded-xl bg-muted/40 animate-pulse"
      />
    ),
  }
);

const DISPLAY_W = 280; // card display width in pixels (canvas is 420, scaled to 280)
const DISPLAY_SCALE = DISPLAY_W / STAGE_W;
const DISPLAY_H = Math.round(STAGE_H * DISPLAY_SCALE);

export default function CardEditorPage() {
  const t = useTranslations("editor");
  const { user } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "cs";
  const cardId = params?.cardId as string;

  const [initialCard, setInitialCard] = useState<Card | null>(null);
  const [initialPlayer, setInitialPlayer] = useState<Player | null>(null);
  const [initialTemplate, setInitialTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<EditorTab>("content");

  // Load card + related data
  useEffect(() => {
    if (!user || !cardId) return;
    (async () => {
      const c = await getCardDoc(cardId);
      if (!c || c.userId !== user.uid) {
        router.replace(`/${locale}/cards`);
        return;
      }
      const [p, tmpl] = await Promise.all([
        getPlayerDoc(user.uid, c.playerId),
        c.templateId ? getTemplateDoc(c.templateId) : Promise.resolve(null),
      ]);
      setInitialCard(c);
      setInitialPlayer(p);
      setInitialTemplate(tmpl);
      setLoading(false);
    })();
  }, [user, cardId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading || !initialCard) {
    return <EditorSkeleton />;
  }

  return (
    <EditorInner
      locale={locale}
      cardId={cardId}
      initialCard={initialCard}
      initialPlayer={initialPlayer}
      initialTemplate={initialTemplate}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      t={t}
    />
  );
}

// Separate component so useCardEditor only mounts after data is ready
function EditorInner({
  locale,
  cardId,
  initialCard,
  initialPlayer,
  initialTemplate,
  activeTab,
  onTabChange,
  t,
}: {
  locale: string;
  cardId: string;
  initialCard: Card;
  initialPlayer: Player | null;
  initialTemplate: Template | null;
  activeTab: EditorTab;
  onTabChange: (tab: EditorTab) => void;
  t: ReturnType<typeof useTranslations<"editor">>;
}) {
  const {
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
  } = useCardEditor(initialCard, initialPlayer, initialTemplate);

  return (
    <div className="flex flex-col h-full max-h-screen overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Link href={`/${locale}/cards/${cardId}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-base font-display font-bold truncate">
            {t("title")}
          </h1>
          {isDirty && (
            <span className="text-xs text-muted-foreground shrink-0">
              · {t("unsavedChanges")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={exportPNG}
            disabled={isExporting}
            className="gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">
              {isExporting ? t("exporting") : t("exportPNG")}
            </span>
          </Button>
          <Button
            size="sm"
            onClick={save}
            disabled={isSaving || !isDirty}
            className="gap-1.5"
          >
            <Save className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">
              {isSaving ? t("saving") : t("save")}
            </span>
          </Button>
        </div>
      </div>

      {/* Body — two-column on desktop, stacked on mobile */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas column */}
        <div className="flex items-start justify-center p-4 shrink-0 overflow-auto">
          {/* Wrapper scales Konva stage (420×588) to display size */}
          <div
            style={{ width: DISPLAY_W, height: DISPLAY_H }}
            className="relative rounded-xl overflow-hidden shadow-xl shrink-0"
          >
            <div
              style={{
                transform: `scale(${DISPLAY_SCALE})`,
                transformOrigin: "top left",
                width: STAGE_W,
                height: STAGE_H,
              }}
            >
              <CardEditorCanvas
                card={card}
                player={player}
                template={template}
                onStageReady={setStage}
              />
            </div>
          </div>
        </div>

        {/* Panel column */}
        <div className="flex-1 flex flex-col min-w-0 border-l border-border overflow-hidden">
          {/* Tabs */}
          <div className="p-3 shrink-0">
            <EditorToolbar activeTab={activeTab} onTabChange={onTabChange} />
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto p-3 pt-0">
            {activeTab === "content" && (
              <ContentPanel
                card={card}
                player={player}
                onUpdateStat={updateStat}
                onUpdateSeason={updateSeason}
              />
            )}
            {activeTab === "design" && (
              <DesignPanel
                card={card}
                onUpdateTemplate={updateTemplate}
                onUpdateRarity={updateRarity}
              />
            )}
            {activeTab === "effects" && (
              <EffectsPanel
                currentEffect={card.effect}
                onUpdateEffect={updateEffect}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EditorSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-5 w-40" />
        <div className="ml-auto flex gap-2">
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="p-4">
          <Skeleton
            style={{ width: DISPLAY_W, height: DISPLAY_H }}
            className="rounded-xl"
          />
        </div>
        <div className="flex-1 p-3 border-l border-border space-y-3">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-9 w-full rounded-lg" />
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
