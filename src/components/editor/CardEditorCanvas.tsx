"use client";
// This component is always loaded via next/dynamic({ ssr: false }) — Konva is safe to import here
import Konva from "konva";
import { useEffect, useRef } from "react";
import { applyEffectToLayer, RARITY_COLORS_CANVAS, hexToRgba } from "@/lib/konvaEffects";
import type { Card, Player, Template, Rarity } from "@/types";

export const STAGE_W = 420;
export const STAGE_H = 588;

const PHOTO_H = Math.round(STAGE_H * 0.60); // 352
const INFO_Y = PHOTO_H;

const CARD_TYPE_LABELS: Record<string, string> = {
  match: "Zápasová",
  mvp: "MVP",
  season: "Sezónní",
  achievement: "Úspěchová",
  team: "Týmová",
  tournament: "Turnajová",
  birthday: "Narozeninová",
  farewell: "Rozlučková",
  champion: "Šampionská",
  rookie: "Nováčkovská",
};

const RARITY_LABELS: Record<Rarity, string> = {
  common: "Běžná",
  uncommon: "Neobvyklá",
  rare: "Vzácná",
  epic: "Epická",
  legendary: "Legendární",
  mythic: "Mýtická",
  limited: "Limitovaná",
};

interface ExportableStage {
  toBlob(options: { pixelRatio: number }): Promise<Blob>;
}

interface CardEditorCanvasProps {
  card: Card;
  player: Player | null;
  template: Template | null;
  onStageReady?: (stage: ExportableStage) => void;
  className?: string;
}

interface LayerRefs {
  bg: Konva.Layer;
  photo: Konva.Layer;
  stats: Konva.Layer;
  text: Konva.Layer;
  effects: Konva.Layer;
  overlay: Konva.Layer;
}

export function CardEditorCanvas({
  card,
  player,
  template,
  onStageReady,
  className,
}: CardEditorCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const layersRef = useRef<LayerRefs | null>(null);

  // Initialize stage once — never recreate on re-render
  useEffect(() => {
    if (!containerRef.current) return;

    const stage = new Konva.Stage({
      container: containerRef.current,
      width: STAGE_W,
      height: STAGE_H,
    });

    const layers: LayerRefs = {
      bg: new Konva.Layer(),
      photo: new Konva.Layer(),
      stats: new Konva.Layer(),
      text: new Konva.Layer(),
      effects: new Konva.Layer(),
      overlay: new Konva.Layer(),
    };

    stage.add(
      layers.bg,
      layers.photo,
      layers.stats,
      layers.text,
      layers.effects,
      layers.overlay
    );

    stageRef.current = stage;
    layersRef.current = layers;
    onStageReady?.(stage as unknown as ExportableStage);

    return () => {
      stage.destroy();
      stageRef.current = null;
      layersRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Imperatively redraw when card/player/template props change
  useEffect(() => {
    const layers = layersRef.current;
    if (!layers) return;
    const color = RARITY_COLORS_CANVAS[card.rarity] ?? "#888888";
    drawBackground(layers.bg, card, color);
    drawPhoto(layers.photo, player, color);
    drawStats(layers.stats, card, color);
    drawText(layers.text, card, player, color);
    applyEffectToLayer(layers.effects, card.effect, STAGE_W, STAGE_H);
    drawOverlay(layers.overlay, card, player, color);
  }, [card, player, template]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: STAGE_W, height: STAGE_H }}
    />
  );
}

// ─── Layer draw functions ─────────────────────────────────────────────────────

function drawBackground(layer: Konva.Layer, card: Card, color: string) {
  layer.destroyChildren();

  layer.add(
    new Konva.Rect({
      x: 0,
      y: 0,
      width: STAGE_W,
      height: STAGE_H,
      fillLinearGradientStartPoint: { x: STAGE_W / 2, y: 0 },
      fillLinearGradientEndPoint: { x: STAGE_W / 2, y: STAGE_H },
      fillLinearGradientColorStops: [0, "#1a1a2e", 0.5, "#16213e", 1, "#0f3460"],
      cornerRadius: 16,
    })
  );

  layer.add(
    new Konva.Rect({
      x: 0,
      y: 0,
      width: STAGE_W,
      height: STAGE_H,
      fill: color,
      opacity: card.rarity === "mythic" ? 0.22 : 0.12,
      cornerRadius: 16,
    })
  );

  layer.batchDraw();
}

function drawPhoto(layer: Konva.Layer, player: Player | null, color: string) {
  layer.destroyChildren();

  if (player?.photoURL) {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      layer.destroyChildren();

      // Cover-fit crop, top-aligned so faces stay visible
      const srcW = img.naturalWidth;
      const srcH = img.naturalHeight;
      const scale = Math.max(STAGE_W / srcW, PHOTO_H / srcH);
      const cropW = STAGE_W / scale;
      const cropH = PHOTO_H / scale;
      const cropX = (srcW - cropW) / 2;

      layer.add(
        new Konva.Image({
          x: 0,
          y: 0,
          width: STAGE_W,
          height: PHOTO_H,
          image: img,
          crop: { x: cropX, y: 0, width: cropW, height: cropH },
          cornerRadius: [16, 16, 0, 0],
        })
      );

      // Fade the bottom of the photo into the dark info area
      layer.add(
        new Konva.Rect({
          x: 0,
          y: PHOTO_H - 130,
          width: STAGE_W,
          height: 130,
          fillLinearGradientStartPoint: { x: 0, y: 0 },
          fillLinearGradientEndPoint: { x: 0, y: 130 },
          fillLinearGradientColorStops: [
            0, "rgba(26,26,46,0)",
            1, "rgba(22,33,62,0.95)",
          ],
        })
      );

      layer.batchDraw();
    };
    img.src = player.photoURL;
  } else {
    // Placeholder gradient + silhouette circle
    layer.add(
      new Konva.Rect({
        x: 0,
        y: 0,
        width: STAGE_W,
        height: PHOTO_H,
        fillLinearGradientStartPoint: { x: STAGE_W / 2, y: 0 },
        fillLinearGradientEndPoint: { x: STAGE_W / 2, y: PHOTO_H },
        fillLinearGradientColorStops: [
          0, hexToRgba(color, 0.22),
          1, hexToRgba(color, 0.06),
        ],
        cornerRadius: [16, 16, 0, 0],
      })
    );

    layer.add(
      new Konva.Circle({
        x: STAGE_W / 2,
        y: PHOTO_H * 0.40,
        radius: 64,
        fill: hexToRgba(color, 0.25),
      })
    );

    // Bottom fade
    layer.add(
      new Konva.Rect({
        x: 0,
        y: PHOTO_H - 100,
        width: STAGE_W,
        height: 100,
        fillLinearGradientStartPoint: { x: 0, y: 0 },
        fillLinearGradientEndPoint: { x: 0, y: 100 },
        fillLinearGradientColorStops: [
          0, "rgba(26,26,46,0)",
          1, "rgba(22,33,62,0.95)",
        ],
      })
    );

    layer.batchDraw();
  }
}

function drawStats(layer: Konva.Layer, card: Card, color: string) {
  layer.destroyChildren();

  const { goals, assists, rating, overall } = card.cardStats;
  const items: { label: string; value: number | string }[] = [
    { label: "GOL", value: goals ?? 0 },
    { label: "ASS", value: assists ?? 0 },
    { label: "HOD", value: rating ?? 5 },
    { label: "CEL", value: overall ?? 50 },
  ].filter((s) => s.value !== undefined);

  const BOX_W = 70;
  const BOX_H = 58;
  const SPACING = 8;
  const BOX_Y = INFO_Y + 82;
  const totalW = items.length * BOX_W + (items.length - 1) * SPACING;
  const startX = (STAGE_W - totalW) / 2;

  items.forEach(({ label, value }, i) => {
    const x = startX + i * (BOX_W + SPACING);

    layer.add(
      new Konva.Rect({
        x,
        y: BOX_Y,
        width: BOX_W,
        height: BOX_H,
        fill: hexToRgba(color, 0.22),
        cornerRadius: 8,
      })
    );

    layer.add(
      new Konva.Text({
        x,
        y: BOX_Y + 9,
        width: BOX_W,
        text: String(value),
        fontSize: 22,
        fontFamily: "Oswald, sans-serif",
        fontStyle: "bold",
        fill: color,
        align: "center",
      })
    );

    layer.add(
      new Konva.Text({
        x,
        y: BOX_Y + 37,
        width: BOX_W,
        text: label,
        fontSize: 10,
        fontFamily: "Inter, sans-serif",
        fill: "rgba(255,255,255,0.55)",
        align: "center",
      })
    );
  });

  layer.batchDraw();
}

function drawText(
  layer: Konva.Layer,
  card: Card,
  player: Player | null,
  color: string
) {
  layer.destroyChildren();

  // Player name
  layer.add(
    new Konva.Text({
      x: 22,
      y: INFO_Y + 16,
      width: STAGE_W - 44,
      text: player?.displayName ?? "Hráč",
      fontSize: 28,
      fontFamily: "Oswald, sans-serif",
      fontStyle: "bold",
      fill: color,
    })
  );

  // Card type · season
  const typeLabel = CARD_TYPE_LABELS[card.cardType] ?? card.cardType;
  const subtitle = card.season ? `${typeLabel} · ${card.season}` : typeLabel;

  layer.add(
    new Konva.Text({
      x: 22,
      y: INFO_Y + 52,
      width: STAGE_W - 44,
      text: subtitle,
      fontSize: 12,
      fontFamily: "Inter, sans-serif",
      fill: "rgba(255,255,255,0.55)",
    })
  );

  layer.batchDraw();
}

function drawOverlay(
  layer: Konva.Layer,
  card: Card,
  player: Player | null,
  color: string
) {
  layer.destroyChildren();

  // Card border
  layer.add(
    new Konva.Rect({
      x: 2,
      y: 2,
      width: STAGE_W - 4,
      height: STAGE_H - 4,
      stroke: hexToRgba(color, 0.48),
      strokeWidth: 2,
      cornerRadius: 14,
    })
  );

  // Rarity badge — top left
  const badgeText = RARITY_LABELS[card.rarity] ?? card.rarity;
  const badgeW = badgeText.length * 7.2 + 18;
  const BADGE_X = 14;
  const BADGE_Y = 14;

  layer.add(
    new Konva.Rect({
      x: BADGE_X,
      y: BADGE_Y,
      width: badgeW,
      height: 22,
      fill: hexToRgba(color, 0.88),
      cornerRadius: 11,
    })
  );

  layer.add(
    new Konva.Text({
      x: BADGE_X,
      y: BADGE_Y + 5,
      width: badgeW,
      text: badgeText.toUpperCase(),
      fontSize: 9,
      fontFamily: "Inter, sans-serif",
      fontStyle: "bold",
      fill: "#0a0a0a",
      align: "center",
    })
  );

  // Jersey number — top right
  if (player?.jerseyNumber) {
    layer.add(
      new Konva.Text({
        x: STAGE_W - 64,
        y: 12,
        width: 50,
        text: `#${player.jerseyNumber}`,
        fontSize: 19,
        fontFamily: "Oswald, sans-serif",
        fontStyle: "bold",
        fill: hexToRgba(color, 0.65),
        align: "right",
      })
    );
  }

  layer.batchDraw();
}
