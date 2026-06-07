import Konva from "konva";
import type { CardEffect, Rarity } from "@/types";

// Actual hex values corresponding to the rarity CSS tokens — used in Konva (no CSS vars)
export const RARITY_COLORS_CANVAS: Record<Rarity, string> = {
  common: "#888888",
  uncommon: "#22c55e",
  rare: "#4f8ef7",
  epic: "#b06cf8",
  legendary: "#c9a227",
  mythic: "#c9a227",
  limited: "#ef4444",
};

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function applyEffectToLayer(
  layer: Konva.Layer,
  effect: CardEffect,
  width: number,
  height: number
): void {
  layer.destroyChildren();

  switch (effect) {
    case "goldFoil":
      layer.add(
        new Konva.Rect({
          x: 0,
          y: 0,
          width,
          height,
          fillLinearGradientStartPoint: { x: 0, y: 0 },
          fillLinearGradientEndPoint: { x: width, y: height },
          fillLinearGradientColorStops: [
            0, "rgba(201,150,12,0)",
            0.35, "rgba(255,215,0,0.28)",
            0.65, "rgba(201,150,12,0.05)",
            1, "rgba(255,215,0,0.22)",
          ],
          listening: false,
        })
      );
      layer.add(
        new Konva.Rect({
          x: 0,
          y: 0,
          width,
          height,
          fillLinearGradientStartPoint: { x: width, y: 0 },
          fillLinearGradientEndPoint: { x: 0, y: height },
          fillLinearGradientColorStops: [
            0, "rgba(255,200,50,0.12)",
            0.5, "rgba(255,215,0,0)",
            1, "rgba(255,180,0,0.15)",
          ],
          listening: false,
        })
      );
      break;

    case "hologram":
      layer.add(
        new Konva.Rect({
          x: 0,
          y: 0,
          width,
          height,
          fillLinearGradientStartPoint: { x: 0, y: 0 },
          fillLinearGradientEndPoint: { x: width, y: height },
          fillLinearGradientColorStops: [
            0, "rgba(0,200,255,0.18)",
            0.25, "rgba(180,0,255,0.18)",
            0.5, "rgba(255,215,0,0.18)",
            0.75, "rgba(0,255,100,0.18)",
            1, "rgba(0,200,255,0.18)",
          ],
          listening: false,
        })
      );
      break;

    case "neon":
      layer.add(
        new Konva.Rect({
          x: 0,
          y: 0,
          width,
          height,
          fillLinearGradientStartPoint: { x: 0, y: 0 },
          fillLinearGradientEndPoint: { x: 0, y: height },
          fillLinearGradientColorStops: [
            0, "rgba(0,255,200,0.08)",
            1, "rgba(0,200,255,0.12)",
          ],
          listening: false,
        })
      );
      layer.add(
        new Konva.Rect({
          x: 4,
          y: 4,
          width: width - 8,
          height: height - 8,
          stroke: "rgba(0,255,200,0.9)",
          strokeWidth: 2.5,
          cornerRadius: 10,
          shadowColor: "rgba(0,255,200,1)",
          shadowBlur: 24,
          shadowOpacity: 0.85,
          listening: false,
        })
      );
      break;

    case "led": {
      const spacing = 22;
      for (let x = spacing; x < width; x += spacing) {
        for (let y = spacing; y < height; y += spacing) {
          layer.add(
            new Konva.Circle({
              x,
              y,
              radius: 1.8,
              fill: "rgba(255,240,100,0.35)",
              listening: false,
            })
          );
        }
      }
      break;
    }

    case "fire":
      layer.add(
        new Konva.Rect({
          x: 0,
          y: height * 0.45,
          width,
          height: height * 0.55,
          fillLinearGradientStartPoint: { x: 0, y: 0 },
          fillLinearGradientEndPoint: { x: 0, y: height * 0.55 },
          fillLinearGradientColorStops: [
            0, "rgba(255,120,0,0)",
            1, "rgba(255,40,0,0.50)",
          ],
          listening: false,
        })
      );
      layer.add(
        new Konva.Rect({
          x: 0,
          y: 0,
          width,
          height,
          fillLinearGradientStartPoint: { x: 0, y: height },
          fillLinearGradientEndPoint: { x: width * 0.5, y: 0 },
          fillLinearGradientColorStops: [
            0, "rgba(255,80,0,0.18)",
            0.6, "rgba(255,200,0,0.08)",
            1, "rgba(255,50,0,0.02)",
          ],
          listening: false,
        })
      );
      break;

    default:
      break;
  }

  layer.batchDraw();
}
