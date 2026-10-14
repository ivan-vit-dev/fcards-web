// Card design system. A design is a combination of independent parts — shape, frame, layout,
// palette, background (`pattern`) and finish — curated into themed sets (presets).
// Visual language follows current collectibles: EA FC promo cards (black-gold, icon white-gold,
// TOTY navy), Topps Chrome refractor parallels (refractor, prizm, lava, superfractor),
// Match Attax limited editions (Stadium Lights, ElectriX, Black Fire) and Marvel Snap frame breaks.
// Everything is plain data/CSS so a design renders identically on screen, in PNG and in print.

import type {
  Card,
  CardDesign,
  FinishId,
  FrameId,
  LayoutId,
  PatternId,
  ShapeId,
  SubscriptionTier,
} from "@/types";

export type { CardDesign, FinishId, FrameId, LayoutId, PatternId, ShapeId };

// ─── Palettes ─────────────────────────────────────────────────────────────────

export interface Palette {
  nameCs: string;
  bg1: string; // face gradient start (top)
  bg2: string; // face gradient end (bottom)
  accent: string; // name, rating, highlights
  accent2: string; // second light/colour for gradients, beams, auras
  text: string;
  muted: string;
}

export const PALETTES: Record<string, Palette> = {
  gold: {
    nameCs: "Zlatá",
    bg1: "oklch(0.9 0.1 92)",
    bg2: "oklch(0.7 0.13 72)",
    accent: "oklch(0.3 0.06 60)",
    accent2: "oklch(0.98 0.04 95)",
    text: "oklch(0.25 0.05 60)",
    muted: "oklch(0.4 0.06 65)",
  },
  blackgold: {
    nameCs: "Černé zlato",
    bg1: "oklch(0.24 0.01 80)",
    bg2: "oklch(0.1 0 0)",
    accent: "oklch(0.86 0.14 88)",
    accent2: "oklch(0.7 0.14 70)",
    text: "oklch(0.97 0.01 85)",
    muted: "oklch(0.75 0.04 85)",
  },
  icon: {
    nameCs: "Ikona",
    bg1: "oklch(0.99 0.005 90)",
    bg2: "oklch(0.9 0.03 88)",
    accent: "oklch(0.62 0.13 75)",
    accent2: "oklch(0.85 0.12 88)",
    text: "oklch(0.22 0.02 70)",
    muted: "oklch(0.45 0.03 70)",
  },
  royal: {
    nameCs: "Rok hvězd",
    bg1: "oklch(0.32 0.13 265)",
    bg2: "oklch(0.13 0.06 268)",
    accent: "oklch(0.86 0.14 88)",
    accent2: "oklch(0.65 0.17 250)",
    text: "oklch(0.98 0.01 260)",
    muted: "oklch(0.8 0.05 255)",
  },
  purple: {
    nameCs: "Fialová hvězda",
    bg1: "oklch(0.4 0.18 305)",
    bg2: "oklch(0.15 0.07 295)",
    accent: "oklch(0.88 0.13 90)",
    accent2: "oklch(0.7 0.2 330)",
    text: "oklch(0.98 0.01 300)",
    muted: "oklch(0.8 0.06 300)",
  },
  electric: {
    nameCs: "ElectriX",
    bg1: "oklch(0.25 0.12 285)",
    bg2: "oklch(0.1 0.05 275)",
    accent: "oklch(0.88 0.14 200)",
    accent2: "oklch(0.68 0.27 340)",
    text: "oklch(0.98 0.01 280)",
    muted: "oklch(0.78 0.08 260)",
  },
  toxic: {
    nameCs: "Toxic",
    bg1: "oklch(0.22 0.03 150)",
    bg2: "oklch(0.09 0.01 150)",
    accent: "oklch(0.92 0.23 128)",
    accent2: "oklch(0.75 0.2 155)",
    text: "oklch(0.97 0.02 130)",
    muted: "oklch(0.72 0.06 140)",
  },
  inferno: {
    nameCs: "Black Fire",
    bg1: "oklch(0.2 0.02 30)",
    bg2: "oklch(0.08 0 0)",
    accent: "oklch(0.8 0.17 60)",
    accent2: "oklch(0.62 0.24 30)",
    text: "oklch(0.97 0.02 60)",
    muted: "oklch(0.75 0.06 40)",
  },
  ruby: {
    nameCs: "Rubín",
    bg1: "oklch(0.42 0.18 22)",
    bg2: "oklch(0.15 0.07 20)",
    accent: "oklch(0.95 0.04 40)",
    accent2: "oklch(0.7 0.22 15)",
    text: "oklch(0.98 0.01 30)",
    muted: "oklch(0.83 0.05 25)",
  },
  emerald: {
    nameCs: "Smaragd",
    bg1: "oklch(0.42 0.12 162)",
    bg2: "oklch(0.15 0.05 165)",
    accent: "oklch(0.92 0.12 150)",
    accent2: "oklch(0.75 0.15 175)",
    text: "oklch(0.98 0.02 150)",
    muted: "oklch(0.8 0.05 160)",
  },
  aqua: {
    nameCs: "Aqua",
    bg1: "oklch(0.5 0.12 210)",
    bg2: "oklch(0.18 0.06 235)",
    accent: "oklch(0.93 0.1 195)",
    accent2: "oklch(0.72 0.15 180)",
    text: "oklch(0.98 0.01 210)",
    muted: "oklch(0.84 0.04 210)",
  },
  frost: {
    nameCs: "Mráz",
    bg1: "oklch(0.98 0.01 230)",
    bg2: "oklch(0.83 0.06 232)",
    accent: "oklch(0.45 0.15 255)",
    accent2: "oklch(0.8 0.1 210)",
    text: "oklch(0.22 0.05 255)",
    muted: "oklch(0.45 0.06 250)",
  },
  sunset: {
    nameCs: "Západ slunce",
    bg1: "oklch(0.72 0.17 55)",
    bg2: "oklch(0.38 0.17 0)",
    accent: "oklch(0.98 0.05 95)",
    accent2: "oklch(0.7 0.2 350)",
    text: "oklch(0.99 0.01 80)",
    muted: "oklch(0.92 0.05 60)",
  },
  platinum: {
    nameCs: "Platina",
    bg1: "oklch(0.4 0.01 250)",
    bg2: "oklch(0.16 0.01 250)",
    accent: "oklch(0.95 0.01 250)",
    accent2: "oklch(0.75 0.03 240)",
    text: "oklch(0.98 0 0)",
    muted: "oklch(0.78 0.01 250)",
  },
  bronze: {
    nameCs: "Bronz",
    bg1: "oklch(0.62 0.09 55)",
    bg2: "oklch(0.32 0.07 45)",
    accent: "oklch(0.95 0.04 75)",
    accent2: "oklch(0.78 0.1 60)",
    text: "oklch(0.98 0.01 70)",
    muted: "oklch(0.88 0.04 65)",
  },
};

const HEX = /^#[0-9a-f]{6}$/i;

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Club/team colours → a full palette with readable text.
export function paletteFromColors(primary: string, secondary: string): Palette {
  const p = HEX.test(primary) ? primary : "#1e3a8a";
  const s = HEX.test(secondary) ? secondary : "#facc15";
  const light = luminance(p) > 0.45;
  return {
    nameCs: "Vlastní",
    bg1: p,
    bg2: `color-mix(in oklch, ${p} 45%, black)`,
    accent: s,
    accent2: `color-mix(in oklch, ${s} 55%, ${p})`,
    text: light ? "oklch(0.2 0 0)" : "oklch(0.98 0 0)",
    muted: light ? "oklch(0.4 0 0)" : "oklch(0.85 0 0)",
  };
}

export function resolvePalette(design: CardDesign): Palette {
  if (design.palette === "custom" && design.customColors) {
    return paletteFromColors(design.customColors.primary, design.customColors.secondary);
  }
  return PALETTES[design.palette] ?? PALETTES.blackgold;
}

// ─── Shapes ───────────────────────────────────────────────────────────────────
// Few, iconic silhouettes. Polygons live in a 100 × 140 box (the card's 5:7 ratio), then become
// percentages for CSS clip-path and fractions for the print cut line.

type Pt = [number, number];

export interface ShapeDef {
  nameCs: string;
  descriptionCs: string;
  /** Corner radius as a fraction of card width — for border-radius shapes (no polygon). */
  radius?: number;
  polygon?: Pt[];
  /** Content-safe insets in % of card height, so badges/text never fall outside the shape. */
  safeTop: number;
  safeBottom: number;
}

export const SHAPES: Record<ShapeId, ShapeDef> = {
  classic: {
    nameCs: "Klasik",
    descriptionCs: "Zaoblené rohy jako Topps Chrome nebo Pokémon",
    radius: 0.05,
    safeTop: 0,
    safeBottom: 0,
  },
  elite: {
    nameCs: "Elite",
    descriptionCs: "Herní silueta: zkosená ramena, výstupek nahoře a hrot dole",
    polygon: [
      [0, 9],
      [8, 3],
      [32, 3],
      [37, 0],
      [63, 0],
      [68, 3],
      [92, 3],
      [100, 9],
      [100, 127],
      [93, 134],
      [57, 134],
      [50, 140],
      [43, 134],
      [7, 134],
      [0, 127],
    ],
    safeTop: 5,
    safeBottom: 6,
  },
  shard: {
    nameCs: "Shard",
    descriptionCs: "Ostré diagonální řezy jako v esportu",
    polygon: [
      [15, 0],
      [100, 0],
      [100, 123],
      [85, 140],
      [0, 140],
      [0, 17],
    ],
    safeTop: 7,
    safeBottom: 7,
  },
  bevel: {
    nameCs: "Bevel",
    descriptionCs: "Čisté zkosené rohy",
    polygon: [
      [6, 0],
      [94, 0],
      [100, 6],
      [100, 134],
      [94, 140],
      [6, 140],
      [0, 134],
      [0, 6],
    ],
    safeTop: 2,
    safeBottom: 2,
  },
};

export function shapeClipPath(shape: ShapeId): string | undefined {
  const poly = SHAPES[shape].polygon;
  if (!poly) return undefined;
  return `polygon(${poly.map(([x, y]) => `${+x.toFixed(2)}% ${+((y / 140) * 100).toFixed(2)}%`).join(", ")})`;
}

/** Cut outline for print, as fractions (0–1) of width/height; plain shapes return their radius. */
export function shapeOutline(shape: ShapeId): { points?: Pt[]; radius?: number } {
  const def = SHAPES[shape];
  if (def.polygon) return { points: def.polygon.map(([x, y]) => [x / 100, y / 140]) };
  return { radius: def.radius };
}

// ─── Frames ───────────────────────────────────────────────────────────────────

export interface FrameDef {
  nameCs: string;
  background: (p: Palette) => string;
  /** Frame thickness as a fraction of card width. */
  thickness: number;
}

export const FRAMES: Record<FrameId, FrameDef> = {
  gold: {
    nameCs: "Zlato",
    thickness: 0.028,
    background: () =>
      "linear-gradient(135deg, oklch(0.93 0.1 95), oklch(0.7 0.15 72) 30%, oklch(0.95 0.08 92) 52%, oklch(0.62 0.14 65) 75%, oklch(0.88 0.12 88))",
  },
  silver: {
    nameCs: "Stříbro",
    thickness: 0.028,
    background: () =>
      "linear-gradient(135deg, oklch(0.98 0 0), oklch(0.66 0.01 250) 30%, oklch(0.95 0.005 250) 52%, oklch(0.55 0.01 250) 75%, oklch(0.9 0 0))",
  },
  bronze: {
    nameCs: "Bronz",
    thickness: 0.028,
    background: () =>
      "linear-gradient(135deg, oklch(0.85 0.08 65), oklch(0.55 0.1 45) 30%, oklch(0.8 0.09 60) 52%, oklch(0.45 0.08 40) 75%, oklch(0.75 0.09 55))",
  },
  chrome: {
    nameCs: "Chrome refraktor",
    thickness: 0.03,
    background: () =>
      "conic-gradient(from 200deg, oklch(0.88 0.12 330), oklch(0.88 0.12 260), oklch(0.92 0.1 200), oklch(0.93 0.14 140), oklch(0.94 0.13 95), oklch(0.9 0.12 40), oklch(0.88 0.12 330))",
  },
  black: {
    nameCs: "Černý lesk",
    thickness: 0.026,
    background: () =>
      "linear-gradient(135deg, oklch(0.45 0 0), oklch(0.12 0 0) 35%, oklch(0.32 0 0) 55%, oklch(0.08 0 0))",
  },
  neon: {
    nameCs: "Neon",
    thickness: 0.02,
    background: (p) => `linear-gradient(135deg, ${p.accent}, ${p.accent2})`,
  },
  ice: {
    nameCs: "Led",
    thickness: 0.028,
    background: () =>
      "linear-gradient(135deg, oklch(0.99 0.01 220), oklch(0.8 0.08 225) 35%, oklch(0.97 0.02 210) 55%, oklch(0.7 0.1 240))",
  },
  rosegold: {
    nameCs: "Rose gold",
    thickness: 0.028,
    background: () =>
      "linear-gradient(135deg, oklch(0.92 0.05 40), oklch(0.7 0.09 25) 32%, oklch(0.93 0.04 45) 55%, oklch(0.62 0.09 20) 78%, oklch(0.85 0.06 35))",
  },
  team: {
    nameCs: "Klubové barvy",
    thickness: 0.028,
    background: (p) => `linear-gradient(135deg, ${p.accent}, ${p.accent2} 50%, ${p.accent})`,
  },
  line: {
    nameCs: "Linka",
    thickness: 0.01,
    background: (p) => p.accent,
  },
};

// ─── Backgrounds (`pattern`) ──────────────────────────────────────────────────

const mix = (c: string, pct: number, other = "transparent") => `color-mix(in oklch, ${c} ${pct}%, ${other})`;

export const PATTERNS: Record<PatternId, { nameCs: string; descriptionCs: string; css: (p: Palette) => string }> = {
  clean: {
    nameCs: "Čisté",
    descriptionCs: "Jemný přechod barev",
    css: (p) => `linear-gradient(165deg, ${p.bg1}, ${p.bg2})`,
  },
  mesh: {
    nameCs: "Aurora",
    descriptionCs: "Rozlité barevné světlo",
    css: (p) =>
      `radial-gradient(ellipse 70% 50% at 15% 15%, ${mix(p.accent2, 55)}, transparent 70%), radial-gradient(ellipse 60% 45% at 90% 35%, ${mix(p.accent, 35)}, transparent 70%), radial-gradient(ellipse 80% 50% at 60% 100%, ${mix(p.accent2, 45)}, transparent 70%), linear-gradient(165deg, ${p.bg1}, ${p.bg2})`,
  },
  beams: {
    nameCs: "Reflektory",
    descriptionCs: "Světla stadionu shora",
    css: (p) =>
      `conic-gradient(from 160deg at 12% -8%, transparent 0deg, ${mix(p.accent2, 28)} 6deg, transparent 14deg, transparent 22deg, ${mix(p.accent2, 18)} 27deg, transparent 33deg), conic-gradient(from 168deg at 88% -8%, transparent 0deg, ${mix(p.accent2, 18)} 5deg, transparent 11deg, transparent 18deg, ${mix(p.accent2, 28)} 24deg, transparent 31deg), radial-gradient(ellipse 90% 40% at 50% 0%, ${mix(p.accent2, 40)}, transparent 70%), linear-gradient(170deg, ${p.bg1}, ${p.bg2})`,
  },
  facets: {
    nameCs: "Geometrie",
    descriptionCs: "Velké lomené plochy jako herní karty",
    css: (p) =>
      `linear-gradient(118deg, transparent 0 38%, ${mix(p.accent2, 16)} 38% 54%, transparent 54%), linear-gradient(62deg, transparent 0 58%, ${mix("black", 22)} 58% 100%), linear-gradient(150deg, ${mix("white", 10)} 0 26%, transparent 26%), linear-gradient(28deg, ${mix(p.accent, 10)} 0 22%, transparent 22%), linear-gradient(165deg, ${p.bg1}, ${p.bg2})`,
  },
  number: {
    nameCs: "Velké číslo",
    descriptionCs: "Obří číslo dresu za hráčem",
    css: (p) => `radial-gradient(ellipse 80% 60% at 50% 30%, ${mix(p.accent2, 25)}, transparent 70%), linear-gradient(165deg, ${p.bg1}, ${p.bg2})`,
  },
  lava: {
    nameCs: "Láva",
    descriptionCs: "Roztavené barevné skvrny",
    css: (p) =>
      `radial-gradient(circle at 18% 78%, ${mix(p.accent2, 70)} 0 9%, transparent 22%), radial-gradient(circle at 82% 62%, ${mix(p.accent, 45)} 0 7%, transparent 19%), radial-gradient(circle at 70% 18%, ${mix(p.accent2, 55)} 0 6%, transparent 17%), radial-gradient(circle at 30% 30%, ${mix(p.accent, 30)} 0 5%, transparent 15%), radial-gradient(ellipse at 50% 100%, ${mix(p.accent2, 45)}, transparent 60%), linear-gradient(165deg, ${p.bg1}, ${p.bg2})`,
  },
  spiral: {
    nameCs: "Superfractor",
    descriptionCs: "Zlatý vír 1/1",
    css: (p) =>
      `repeating-conic-gradient(from 0deg at 50% 38%, oklch(0.85 0.13 88 / 0.5) 0deg 4deg, oklch(0.55 0.12 70 / 0.35) 4deg 9deg, oklch(0.95 0.08 95 / 0.45) 9deg 12deg), radial-gradient(circle at 50% 38%, oklch(0.9 0.12 90 / 0.6), transparent 60%), linear-gradient(165deg, ${p.bg1}, ${p.bg2})`,
  },
  smoke: {
    nameCs: "Kouř a žár",
    descriptionCs: "Temný kouř se žhnoucím okrajem",
    css: (p) =>
      `radial-gradient(ellipse 120% 45% at 50% 108%, ${mix(p.accent2, 85)}, ${mix(p.accent, 30)} 40%, transparent 70%), radial-gradient(ellipse 50% 35% at 20% 30%, ${mix("white", 8)}, transparent 70%), radial-gradient(ellipse 60% 40% at 85% 55%, ${mix("white", 6)}, transparent 70%), linear-gradient(180deg, ${p.bg1}, ${p.bg2})`,
  },
};

// ─── Finishes (light overlays; move with the pointer on interactive cards) ────

export interface FinishDef {
  nameCs: string;
  image?: string; // background-image list
  size?: string; // background-size; "200% 200%" lets the pointer move the effect
  blend?: string;
  opacity?: number;
}

export const FINISHES: Record<FinishId, FinishDef> = {
  none: { nameCs: "Matný" },
  gloss: {
    nameCs: "Lesk",
    image: "linear-gradient(155deg, oklch(1 0 0 / 0.32) 0%, transparent 32%, transparent 68%, oklch(1 0 0 / 0.1))",
    size: "200% 200%",
  },
  refractor: {
    nameCs: "Refraktor",
    image:
      "linear-gradient(115deg, transparent 15%, oklch(0.8 0.2 330) 28%, oklch(0.85 0.15 250) 38%, oklch(0.9 0.15 195) 48%, oklch(0.92 0.18 135) 58%, oklch(0.93 0.17 90) 68%, transparent 82%)",
    size: "250% 250%",
    blend: "color-dodge",
    opacity: 0.22,
  },
  prizm: {
    nameCs: "Prizm",
    image:
      "conic-gradient(from 45deg at 50% 50%, oklch(0.8 0.2 330), oklch(0.85 0.15 250), oklch(0.9 0.15 195), oklch(0.92 0.18 135), oklch(0.93 0.17 90), oklch(0.8 0.2 330)), repeating-linear-gradient(45deg, oklch(1 0 0 / 0.5) 0 12%, transparent 12% 24%), repeating-linear-gradient(-45deg, oklch(1 0 0 / 0.4) 0 12%, transparent 12% 24%)",
    size: "200% 200%",
    blend: "overlay",
    opacity: 0.4,
  },
  shimmer: {
    nameCs: "Shimmer",
    image:
      "linear-gradient(105deg, transparent 30%, oklch(1 0 0 / 0.55) 45%, oklch(1 0 0 / 0.15) 50%, oklch(1 0 0 / 0.5) 55%, transparent 70%)",
    size: "250% 250%",
    blend: "soft-light",
  },
  goldglint: {
    nameCs: "Zlatý třpyt",
    image:
      "radial-gradient(circle at 30% 25%, oklch(0.97 0.1 95 / 0.9), transparent 22%), radial-gradient(circle at 75% 70%, oklch(0.9 0.14 85 / 0.7), transparent 25%), linear-gradient(120deg, transparent 30%, oklch(0.92 0.13 90 / 0.6) 48%, transparent 66%)",
    size: "200% 200%",
    blend: "overlay",
  },
  speckle: {
    nameCs: "Jiskry",
    // A handful of soft star glints in large co-prime tiles, so they never read as a dot pattern.
    image:
      "radial-gradient(circle at 20% 30%, oklch(1 0 0 / 0.9) 0 0.5px, oklch(1 0 0 / 0.25) 1.5px, transparent 4px), radial-gradient(circle at 70% 60%, oklch(0.97 0.08 90 / 0.8) 0 0.5px, oklch(1 0 0 / 0.2) 1.5px, transparent 5px), linear-gradient(125deg, transparent 35%, oklch(1 0 0 / 0.14) 50%, transparent 65%)",
    size: "7.3em 9.1em, 11.3em 6.7em, 200% 200%",
    blend: "screen",
  },
};

/** Fine film grain laid over every face — gives gradients a printed, premium feel. */
export const GRAIN = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0.55 0"/></filter><rect width="160" height="160" filter="url(#n)"/></svg>`
)}")`;

// ─── Layouts ──────────────────────────────────────────────────────────────────

export const LAYOUTS: Record<LayoutId, { nameCs: string; descriptionCs: string; window: boolean }> = {
  pro: { nameCs: "Pro", descriptionCs: "Hodnocení a pozice vlevo nahoře, statistiky ve dvou řadách", window: false },
  classic: { nameCs: "Klasika", descriptionCs: "Fotka nahoře, jméno a statistiky dole", window: false },
  fullbleed: { nameCs: "Přes celou", descriptionCs: "Fotka přes celou kartičku, text přes ni", window: false },
  sidebar: { nameCs: "Boční pruh", descriptionCs: "Jméno svisle v barevném pruhu", window: false },
  sticker: { nameCs: "Okno", descriptionCs: "Fotka v rámečku, jméno na šikmé pásce", window: true },
  minimal: { nameCs: "Minimal", descriptionCs: "Fotka v oblouku, čistý text", window: true },
};

// ─── Sets (presets) ───────────────────────────────────────────────────────────

export type PresetTag = "zaklad" | "specialy" | "chrome" | "legendy";

export const PRESET_TAGS: { id: PresetTag; nameCs: string }[] = [
  { id: "zaklad", nameCs: "Základ" },
  { id: "specialy", nameCs: "Speciály" },
  { id: "chrome", nameCs: "Chrome" },
  { id: "legendy", nameCs: "Legendy" },
];

export interface Preset {
  id: string;
  nameCs: string;
  descriptionCs: string;
  tags: PresetTag[];
  requiredTier: SubscriptionTier;
  design: CardDesign;
}

const d = (
  shape: ShapeId,
  frame: FrameId,
  layout: LayoutId,
  palette: string,
  pattern: PatternId,
  finish: FinishId,
  popOut = false
): CardDesign => ({ shape, frame, layout, palette, pattern, finish, ...(popOut && { popOut }) });

export const PRESETS: Preset[] = [
  // Základ — the everyday ladder, free
  { id: "base-bronze", nameCs: "Bronz", descriptionCs: "Začátek sbírky", tags: ["zaklad"], requiredTier: "free", design: d("elite", "bronze", "pro", "bronze", "facets", "gloss") },
  { id: "base-silver", nameCs: "Stříbro", descriptionCs: "Stříbrná řada", tags: ["zaklad"], requiredTier: "free", design: d("elite", "silver", "pro", "platinum", "facets", "gloss") },
  { id: "base-gold", nameCs: "Zlato", descriptionCs: "Klasická zlatá karta", tags: ["zaklad"], requiredTier: "free", design: d("elite", "gold", "pro", "gold", "facets", "gloss") },
  { id: "totw", nameCs: "Hvězda kola", descriptionCs: "Černozlatá karta za skvělý výkon", tags: ["zaklad", "specialy"], requiredTier: "free", design: d("elite", "gold", "pro", "blackgold", "facets", "shimmer") },
  { id: "chrome-base", nameCs: "Chrome", descriptionCs: "Lesklá chromová karta", tags: ["zaklad", "chrome"], requiredTier: "free", design: d("classic", "silver", "classic", "platinum", "clean", "refractor") },
  { id: "club", nameCs: "Klubovka", descriptionCs: "V barvách týmu", tags: ["zaklad"], requiredTier: "free", design: d("bevel", "team", "sidebar", "royal", "mesh", "gloss") },
  { id: "frost-minimal", nameCs: "Mráz", descriptionCs: "Čistá světlá karta", tags: ["zaklad"], requiredTier: "free", design: d("bevel", "ice", "minimal", "frost", "mesh", "gloss") },
  { id: "window-icon", nameCs: "Album", descriptionCs: "Moderní kartička do alba", tags: ["zaklad"], requiredTier: "free", design: d("classic", "line", "sticker", "icon", "clean", "none") },

  // Speciály — promo-style cards
  { id: "icon", nameCs: "Ikona", descriptionCs: "Bílozlatá karta legend", tags: ["specialy", "legendy"], requiredTier: "premium", design: d("elite", "gold", "pro", "icon", "beams", "goldglint") },
  { id: "toty", nameCs: "Rok hvězd", descriptionCs: "Tmavě modrá se zlatem", tags: ["specialy"], requiredTier: "premium", design: d("elite", "gold", "pro", "royal", "beams", "goldglint") },
  { id: "tots", nameCs: "Fialová hvězda", descriptionCs: "Karta sezóny", tags: ["specialy"], requiredTier: "premium", design: d("elite", "gold", "pro", "purple", "facets", "shimmer") },
  { id: "stadium-lights", nameCs: "Stadium Lights", descriptionCs: "Pod reflektory", tags: ["specialy"], requiredTier: "premium", design: d("classic", "silver", "fullbleed", "royal", "beams", "gloss") },
  { id: "black-fire", nameCs: "Black Fire", descriptionCs: "Temná karta se žhnoucím okrajem", tags: ["specialy"], requiredTier: "premium", design: d("shard", "black", "fullbleed", "inferno", "smoke", "shimmer") },
  { id: "electrix", nameCs: "ElectriX", descriptionCs: "Elektrický neon", tags: ["specialy"], requiredTier: "premium", design: d("shard", "neon", "pro", "electric", "mesh", "refractor") },
  { id: "toxic", nameCs: "Toxic", descriptionCs: "Jedovatě zelený neon s velkým číslem", tags: ["specialy"], requiredTier: "premium", design: d("bevel", "neon", "pro", "toxic", "number", "gloss") },
  { id: "sunset", nameCs: "Západ slunce", descriptionCs: "Teplý gradient", tags: ["specialy"], requiredTier: "premium", design: d("classic", "rosegold", "fullbleed", "sunset", "mesh", "shimmer") },
  { id: "popout-window", nameCs: "Breakout", descriptionCs: "Hráč vystupuje z rámečku", tags: ["specialy"], requiredTier: "premium", design: d("classic", "chrome", "sticker", "electric", "number", "refractor", true) },

  // Chrome — refractor parallels, same card in different colours
  { id: "chrome-aqua", nameCs: "Aqua refraktor", descriptionCs: "Chrome paralela", tags: ["chrome"], requiredTier: "premium", design: d("classic", "chrome", "classic", "aqua", "clean", "refractor") },
  { id: "chrome-gold", nameCs: "Gold refraktor", descriptionCs: "Chrome paralela", tags: ["chrome"], requiredTier: "premium", design: d("classic", "gold", "classic", "blackgold", "clean", "refractor") },
  { id: "chrome-lava", nameCs: "Red Lava", descriptionCs: "Lávová paralela", tags: ["chrome"], requiredTier: "premium", design: d("classic", "chrome", "classic", "ruby", "lava", "refractor") },
  { id: "chrome-emerald", nameCs: "Green Lava", descriptionCs: "Lávová paralela", tags: ["chrome"], requiredTier: "premium", design: d("classic", "chrome", "classic", "emerald", "lava", "refractor") },
  { id: "chrome-prizm", nameCs: "Prizm", descriptionCs: "Kaleidoskop barev", tags: ["chrome"], requiredTier: "premium", design: d("classic", "chrome", "classic", "platinum", "mesh", "prizm") },

  // Legendy — the rarest looks
  { id: "superfractor", nameCs: "Superfractor 1/1", descriptionCs: "Zlatý vír, jediná svého druhu", tags: ["legendy", "chrome"], requiredTier: "premium", design: d("elite", "gold", "pro", "blackgold", "spiral", "goldglint") },
  { id: "inferno-legend", nameCs: "Inferno", descriptionCs: "Legenda v plamenech", tags: ["legendy"], requiredTier: "premium", design: d("elite", "black", "pro", "inferno", "lava", "goldglint") },
  { id: "frozen-legend", nameCs: "Frozen", descriptionCs: "Ledová legenda", tags: ["legendy"], requiredTier: "premium", design: d("bevel", "ice", "pro", "frost", "beams", "refractor") },
  { id: "rose-legend", nameCs: "Rose Gold", descriptionCs: "Elegantní prémiová karta", tags: ["legendy"], requiredTier: "premium", design: d("elite", "rosegold", "pro", "ruby", "spiral", "shimmer") },
];

export const DEFAULT_PRESET: Preset = PRESETS.find((p) => p.id === "base-gold")!;
export const DEFAULT_DESIGN: CardDesign = DEFAULT_PRESET.design;

export function getPreset(id: string | undefined): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}

/** Custom (mix-and-match) designs need a paid tier; presets carry their own tier. */
export const CUSTOM_DESIGN_TIER: SubscriptionTier = "premium";

// ─── Backwards compatibility ──────────────────────────────────────────────────
// Earlier versions stored other part ids; map them onto today's catalogue.

const OLD_SHAPES: Record<string, ShapeId> = {
  rounded: "classic",
  sharp: "classic",
  soft: "classic",
  arch: "classic",
  ticket: "classic",
  shield: "elite",
  crest: "elite",
  hexagon: "elite",
  octagon: "bevel",
  notch: "shard",
};
const OLD_FRAMES: Record<string, FrameId> = { holo: "chrome", carbon: "black", marble: "silver", fire: "rosegold", emerald: "chrome", thin: "line" };
const OLD_PATTERNS: Record<string, PatternId> = { none: "clean", rays: "beams", hex: "facets" };
const OLD_FINISHES: Record<string, FinishId> = { foil: "goldglint", holo: "refractor", glitter: "speckle", prism: "prizm" };
const OLD_PALETTES: Record<string, string> = {
  midnight: "blackgold",
  crimson: "ruby",
  violet: "purple",
  ocean: "aqua",
  carbon: "inferno",
  neon: "electric",
  candy: "sunset",
  ice: "frost",
  paper: "icon",
  snow: "icon",
  forest: "emerald",
};

function normalizeDesign(design: CardDesign): CardDesign {
  const shape = (SHAPES[design.shape] ? design.shape : OLD_SHAPES[design.shape]) ?? "classic";
  const frame = (FRAMES[design.frame] ? design.frame : OLD_FRAMES[design.frame]) ?? "gold";
  const pattern = (PATTERNS[design.pattern] ? design.pattern : OLD_PATTERNS[design.pattern]) ?? "clean";
  const finish = (FINISHES[design.finish] ? design.finish : OLD_FINISHES[design.finish]) ?? "none";
  const palette =
    design.palette === "custom" || PALETTES[design.palette]
      ? design.palette
      : OLD_PALETTES[design.palette] ?? "blackgold";
  const layout = LAYOUTS[design.layout] ? design.layout : "classic";
  return { ...design, shape, frame, pattern, finish, palette, layout };
}

// Cards created before the design system carry a template category or a seeded template id.
const LEGACY_PRESETS: Record<string, string> = {
  classic: "base-gold",
  "classic-gold": "base-gold",
  dark: "totw",
  "dark-steel": "totw",
  neon: "electrix",
  "neon-strike": "electrix",
  retro: "window-icon",
  "retro-panini": "window-icon",
  holographic: "chrome-prizm",
  "holographic-elite": "chrome-prizm",
};

export function resolveDesign(card: Pick<Card, "design" | "templateId" | "templateStyle">): CardDesign {
  if (card.design) return normalizeDesign(card.design);
  const presetId =
    getPreset(card.templateId)?.id ??
    LEGACY_PRESETS[card.templateStyle ?? ""] ??
    LEGACY_PRESETS[card.templateId ?? ""];
  return getPreset(presetId)?.design ?? DEFAULT_DESIGN;
}
