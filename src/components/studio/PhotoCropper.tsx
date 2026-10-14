"use client";

import { useEffect, useRef, useState } from "react";
import { ZoomIn, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

// Viewport in the card's 5:7 ratio; the crop is exported at up to OUT_W px wide.
const VIEW_W = 280;
const VIEW_H = 392;
const OUT_W = 1200;
const MAX_ZOOM = 5;

interface Props {
  src: string;
  /** Keep transparency (PNG) for background-removed photos. */
  transparent: boolean;
  onCancel: () => void;
  onCrop: (blob: Blob) => Promise<void>;
}

interface View {
  zoom: number;
  x: number; // image top-left relative to the viewport, px
  y: number;
}

// Drag to move, slider to zoom. Frames the player waist-up so AI gets a big face.
export function PhotoCropper({ src, transparent, onCancel, onCrop }: Props) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [view, setView] = useState<View>({ zoom: 1, x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // Storage serves CORS headers; needed to export the canvas
    img.onload = () => {
      imgRef.current = img;
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      setNatural({ w, h });
      // Start covering the frame, centred horizontally and aligned to the top (heads are up there).
      const s = Math.max(VIEW_W / w, VIEW_H / h);
      setView({ zoom: 1, x: (VIEW_W - w * s) / 2, y: 0 });
    };
    img.onerror = () => setError("Fotku se nepodařilo načíst.");
    img.src = src;
  }, [src]);

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!natural) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const baseScale = Math.max(VIEW_W / natural.w, VIEW_H / natural.h);
  const scaleOf = (zoom: number) => baseScale * zoom;

  // Keep the image covering the whole frame.
  const clamp = (v: View): View => {
    const s = scaleOf(v.zoom);
    return {
      zoom: v.zoom,
      x: Math.min(0, Math.max(VIEW_W - natural.w * s, v.x)),
      y: Math.min(0, Math.max(VIEW_H - natural.h * s, v.y)),
    };
  };

  // Zoom around the frame centre so the face under it stays in place.
  const setZoom = (zoom: number) =>
    setView((v) => {
      const s0 = scaleOf(v.zoom);
      const s1 = scaleOf(zoom);
      const cx = (VIEW_W / 2 - v.x) / s0;
      const cy = (VIEW_H / 2 - v.y) / s0;
      return clamp({ zoom, x: VIEW_W / 2 - cx * s1, y: VIEW_H / 2 - cy * s1 });
    });

  const scale = scaleOf(view.zoom);

  const handleSave = async () => {
    const img = imgRef.current;
    if (!img) return;
    setSaving(true);
    try {
      const sx = -view.x / scale;
      const sy = -view.y / scale;
      const sw = VIEW_W / scale;
      const sh = VIEW_H / scale;
      // Never upscale: a crop smaller than OUT_W keeps its native resolution.
      const outW = Math.round(Math.min(OUT_W, sw));
      const outH = Math.round((outW * VIEW_H) / VIEW_W);
      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not available");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, transparent ? "image/png" : "image/jpeg", 0.92)
      );
      if (!blob) throw new Error("Crop export failed");
      await onCrop(blob);
    } catch (err) {
      console.warn("[PhotoCropper]", err);
      setError("Oříznutí se nepodařilo. Zkuste to prosím znovu.");
    } finally {
      setSaving(false);
    }
  };

  const lowRes = VIEW_W / scale < 500;

  return (
    <div className="space-y-4">
      <div
        className="relative mx-auto overflow-hidden rounded-xl bg-muted cursor-grab active:cursor-grabbing touch-none select-none"
        style={{ width: VIEW_W, height: VIEW_H }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { px: e.clientX, py: e.clientY, x: view.x, y: view.y };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          setView((v) => clamp({ ...v, x: d.x + e.clientX - d.px, y: d.y + e.clientY - d.py }));
        }}
        onPointerUp={() => (drag.current = null)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          draggable={false}
          className="absolute max-w-none pointer-events-none"
          style={{ left: view.x, top: view.y, width: natural.w * scale, height: natural.h * scale }}
        />
        {/* Guides: where the head should sit, and the waist line */}
        <div className="absolute inset-x-[30%] top-[8%] h-[30%] rounded-[50%] border-2 border-dashed border-white/70 pointer-events-none" />
        <div className="absolute inset-x-0 top-[78%] border-t border-dashed border-white/50 pointer-events-none" />
      </div>

      <div className="flex items-center gap-3 max-w-xs mx-auto">
        <ZoomIn className="h-4 w-4 text-muted-foreground shrink-0" />
        <Slider
          min={1}
          max={MAX_ZOOM}
          step={0.01}
          value={[view.zoom]}
          onValueChange={(v) => setZoom(Array.isArray(v) ? v[0] : v)}
          aria-label="Přiblížení"
        />
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Táhnutím posuňte fotku, posuvníkem přibližte. Hlavu dejte do oválu, pás zhruba k čárkované čáře.
      </p>
      {lowRes && (
        <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
          Hodně přiblížený výřez má nízké rozlišení — AI bude mít méně detailů. Lepší je ostřejší fotka.
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          Zrušit
        </Button>
        <Button onClick={handleSave} disabled={saving} className="gap-1.5">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Použít výřez
        </Button>
      </div>
    </div>
  );
}
