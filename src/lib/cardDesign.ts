// Card design system. A design is a combination of independent parts — shape, frame, layout,
// palette, background (`pattern`) and finish — curated into themed sets (presets).
// Visual language follows current collectibles: EA FC promo cards (black-gold, icon white-gold,
// TOTY navy), Topps Chrome refractor parallels (refractor, prizm, lava, superfractor),
// Match Attax limited editions (Stadium Lights, ElectriX, Black Fire) and Marvel Snap frame breaks.
// Everything is plain data/CSS so a design renders identically on screen, in PNG and in print.

import type {
  AuraId,
  BadgePlacementId,
  Card,
  CardBadges,
  CardDesign,
  FinishId,
  FrameId,
  LayoutId,
  NameStyleId,
  PatternId,
  PhotoFilterId,
  ShapeId,
  SubscriptionTier,
} from "@/types";

export type { AuraId, CardDesign, FinishId, FrameId, LayoutId, NameStyleId, PatternId, PhotoFilterId, ShapeId };

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
  // Inspired by current game promo editions
  copper: {
    nameCs: "Měď",
    bg1: "oklch(0.42 0.08 45)",
    bg2: "oklch(0.16 0.02 40)",
    accent: "oklch(0.9 0.09 80)",
    accent2: "oklch(0.68 0.16 45)",
    text: "oklch(0.97 0.02 75)",
    muted: "oklch(0.8 0.05 60)",
  },
  scream: {
    nameCs: "Scream",
    bg1: "oklch(0.62 0.19 45)",
    bg2: "oklch(0.3 0.12 30)",
    accent: "oklch(0.97 0.04 80)",
    accent2: "oklch(0.6 0.22 315)",
    text: "oklch(0.99 0.01 80)",
    muted: "oklch(0.9 0.05 60)",
  },
  ghost: {
    nameCs: "Přízrak",
    bg1: "oklch(0.3 0.09 240)",
    bg2: "oklch(0.13 0.05 250)",
    accent: "oklch(0.95 0.05 160)",
    accent2: "oklch(0.78 0.22 145)",
    text: "oklch(0.98 0.02 160)",
    muted: "oklch(0.8 0.06 200)",
  },
  futurestars: {
    nameCs: "Budoucí hvězdy",
    bg1: "oklch(0.32 0.14 295)",
    bg2: "oklch(0.12 0.06 285)",
    accent: "oklch(0.98 0.01 300)",
    accent2: "oklch(0.8 0.12 220)",
    text: "oklch(0.98 0.01 300)",
    muted: "oklch(0.82 0.06 290)",
  },
  hero: {
    nameCs: "Hrdina",
    bg1: "oklch(0.26 0.08 265)",
    bg2: "oklch(0.12 0.04 270)",
    accent: "oklch(0.86 0.15 90)",
    accent2: "oklch(0.7 0.2 320)",
    text: "oklch(0.98 0.01 260)",
    muted: "oklch(0.86 0.12 90)",
  },
  grunge: {
    nameCs: "Grunge",
    bg1: "oklch(0.5 0.005 250)",
    bg2: "oklch(0.18 0.005 250)",
    accent: "oklch(0.97 0 0)",
    accent2: "oklch(0.55 0.2 25)",
    text: "oklch(0.98 0 0)",
    muted: "oklch(0.82 0 0)",
  },
  trailblazer: {
    nameCs: "Průkopník",
    bg1: "oklch(0.42 0.08 200)",
    bg2: "oklch(0.18 0.05 215)",
    accent: "oklch(0.97 0.03 90)",
    accent2: "oklch(0.75 0.17 60)",
    text: "oklch(0.98 0.01 200)",
    muted: "oklch(0.84 0.04 200)",
  },
  amethyst: {
    nameCs: "Ametyst",
    bg1: "oklch(0.38 0.16 300)",
    bg2: "oklch(0.16 0.08 295)",
    accent: "oklch(0.94 0.06 95)",
    accent2: "oklch(0.75 0.12 310)",
    text: "oklch(0.98 0.01 300)",
    muted: "oklch(0.84 0.05 300)",
  },
  flashback: {
    nameCs: "Flashback",
    bg1: "oklch(0.2 0.02 200)",
    bg2: "oklch(0.08 0.01 200)",
    accent: "oklch(0.85 0.15 185)",
    accent2: "oklch(0.65 0.24 25)",
    text: "oklch(0.98 0 0)",
    muted: "oklch(0.8 0.02 200)",
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
    accent2: s, // plain colour: it is also used inside SVG backgrounds
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

function arc(cx: number, cy: number, rx: number, ry: number, from: number, to: number, steps = 10): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const a = ((from + ((to - from) * i) / steps) * Math.PI) / 180;
    pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
  }
  return pts;
}

// Game-promo silhouette: shoulders, two little peaks and a V notch on top, shield point below.
// `inset` narrows the body (used by "pillar", whose side columns sit outside it).
function CROWN_TOP_AND_SHIELD(inset: number): Pt[] {
  const l = inset;
  const r = 100 - inset;
  const w = r - l;
  const x = (f: number) => l + f * w;
  return [
    // top edge, left → right (13 points)
    [l, 9],
    [x(0.08), 4],
    [x(0.3), 4],
    [x(0.35), 0.5],
    [x(0.41), 3],
    [x(0.5), 7],
    [x(0.59), 3],
    [x(0.65), 0.5],
    [x(0.7), 4],
    [x(0.92), 4],
    [r, 9],
    [r, 16],
    [r, 22],
    // right side down and shield bottom, right → left
    [r, 124],
    [x(0.92), 130],
    [x(0.6), 132],
    [x(0.5), 140],
    [x(0.4), 132],
    [x(0.08), 130],
    [l, 124],
  ];
}

// Deterministic jagged "torn paper" outline: walk the card edge and bite in by a seeded
// random amount, with the odd deeper tear — same shape every render, so print matches screen.
function tornOutline(): Pt[] {
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const bite = () => (rand() < 0.12 ? 2.4 + rand() * 2 : rand() * 1.6);
  const pts: Pt[] = [];
  const base: Pt[] = [
    [0, 4],
    [100, 4],
    [100, 124],
    [50, 140],
    [0, 124],
  ];
  for (let s = 0; s < base.length; s++) {
    const [ax, ay] = base[s];
    const [bx, by] = base[(s + 1) % base.length];
    const len = Math.hypot(bx - ax, by - ay);
    const steps = Math.max(3, Math.round(len / 3.2));
    // inward normal for a clockwise outline
    const nx = -(by - ay) / len;
    const ny = (bx - ax) / len;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const d = bite();
      pts.push([ax + (bx - ax) * t + nx * d, ay + (by - ay) * t + ny * d]);
    }
  }
  return pts.map(([px, py]) => [Math.min(100, Math.max(0, px)), Math.min(140, Math.max(0, py))]);
}

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
  fut: {
    nameCs: "Herní",
    descriptionCs: "Klasická herní karta: vykrojené horní rohy a špička dole",
    polygon: [
      ...arc(0, 0, 9, 9, 90, 0, 6),
      ...arc(100, 0, 9, 9, 180, 90, 6),
      [100, 121],
      [50, 140],
      [0, 121],
    ],
    safeTop: 3,
    safeBottom: 11,
  },
  crown: {
    nameCs: "Korunka",
    descriptionCs: "Zubatý vršek se zářezem uprostřed jako speciální edice",
    polygon: CROWN_TOP_AND_SHIELD(0),
    safeTop: 6,
    safeBottom: 8,
  },
  pillar: {
    nameCs: "Sloupky",
    descriptionCs: "Korunka se sloupky po stranách",
    polygon: [
      ...CROWN_TOP_AND_SHIELD(5).slice(0, 13),
      [95, 22],
      [100, 24],
      [100, 108],
      [95, 110],
      ...CROWN_TOP_AND_SHIELD(5).slice(13),
      [5, 110],
      [0, 108],
      [0, 24],
      [5, 22],
    ],
    safeTop: 6,
    safeBottom: 8,
  },
  torn: {
    nameCs: "Natržená",
    descriptionCs: "Roztrhaný papírový okraj",
    polygon: tornOutline(),
    safeTop: 7,
    safeBottom: 11,
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
  /** Second, inner line (the double outline of promo cards): gap and line widths as fractions of
   *  card width; the gap shows the card's dark tone, the line its own colour. */
  inner?: { gap: number; line: number; background: (p: Palette) => string };
  /** Glow colour around the card on screen (neon frames) instead of the rarity glow. */
  glow?: (p: Palette) => string;
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
  doublegold: {
    nameCs: "Dvojitá zlatá",
    thickness: 0.012,
    background: () => "linear-gradient(135deg, oklch(0.93 0.1 95), oklch(0.68 0.14 72) 45%, oklch(0.92 0.1 90))",
    inner: {
      gap: 0.018,
      line: 0.008,
      background: () => "linear-gradient(135deg, oklch(0.9 0.12 90), oklch(0.7 0.14 72))",
    },
  },
  doublesilver: {
    nameCs: "Dvojitá stříbrná",
    thickness: 0.014,
    background: () => "linear-gradient(135deg, oklch(0.98 0 0), oklch(0.62 0.01 250) 45%, oklch(0.94 0.01 300))",
    inner: {
      gap: 0.016,
      line: 0.008,
      background: () => "linear-gradient(135deg, oklch(0.95 0.02 300), oklch(0.72 0.03 290))",
    },
  },
  neonline: {
    nameCs: "Neonové linky",
    thickness: 0.011,
    background: (p) => p.accent2,
    inner: { gap: 0.014, line: 0.009, background: (p) => p.accent },
    glow: (p) => p.accent2,
  },
  paper: {
    nameCs: "Papír",
    thickness: 0.032,
    background: () =>
      "radial-gradient(ellipse at 30% 20%, oklch(0.99 0.01 85), oklch(0.9 0.02 80) 70%), linear-gradient(oklch(0.95 0.015 85), oklch(0.85 0.02 75))",
  },
};

// ─── Backgrounds (`pattern`) ──────────────────────────────────────────────────

const mix = (c: string, pct: number, other = "transparent") => `color-mix(in oklch, ${c} ${pct}%, ${other})`;

// Illustrated backgrounds are SVG drawn in the palette's colours (300 × 420 = card ratio),
// stretched over the face on top of the base gradient. SVG filters (turbulence) give organic
// textures — marble, fire, smoke, grunge — that plain CSS gradients can't.
const ART_W = 300;
const ART_H = 420;

function svgUri(svg: string): string {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function art(p: Palette, body: string, base = `linear-gradient(165deg, ${p.bg1}, ${p.bg2})`): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${ART_W}" height="${ART_H}" viewBox="0 0 ${ART_W} ${ART_H}" preserveAspectRatio="none">${body}</svg>`;
  return `${svgUri(svg)} center / 100% 100% no-repeat, ${base}`;
}

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

// Turbulence noise turned into a coloured layer: alpha = gain·R + bias picks blobs, veins or specks.
function noise(
  id: string,
  opts: { freq: string; seed: number; gain: number; bias: number; color: string; opacity?: number; type?: "turbulence" | "fractalNoise"; octaves?: number }
): string {
  const { freq, seed, gain, bias, color, opacity = 1, type = "fractalNoise", octaves = 3 } = opts;
  return `<filter id="${id}" x="0" y="0" width="100%" height="100%"><feTurbulence type="${type}" baseFrequency="${freq}" numOctaves="${octaves}" seed="${seed}" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 ${gain} 0 0 0 ${bias}" result="a"/><feFlood flood-color="${color}" flood-opacity="${opacity}"/><feComposite in2="a" operator="in"/></filter><rect width="${ART_W}" height="${ART_H}" filter="url(#${id})"/>`;
}

const GLOW_FILTER = (id: string, blur: number) =>
  `<filter id="${id}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${blur}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;

function streakLines(): string {
  const r = rng(3);
  let out = "";
  for (let y = -300; y < ART_H; y += 11) {
    const w = (0.5 + r() * 2.2).toFixed(2);
    const o = (0.08 + r() * 0.3).toFixed(2);
    out += `<line x1="${ART_W + 40}" y1="${y}" x2="-40" y2="${y + 300}" stroke="white" stroke-width="${w}" stroke-opacity="${o}"/>`;
  }
  return out;
}

function neonZigzags(colors: string[]): string {
  const cx = 150;
  const cy = 165;
  let out = "";
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI * 2 + 0.2;
    const pts: string[] = [];
    for (let i = 0; i <= 4; i++) {
      const rad = 40 + i * 70;
      const zig = (i % 2 ? 0.16 : -0.16) + a;
      pts.push(`${(cx + Math.cos(zig) * rad).toFixed(1)},${(cy + Math.sin(zig) * rad).toFixed(1)}`);
    }
    out += `<polyline points="${pts.join(" ")}" fill="none" stroke="${colors[k % colors.length]}" stroke-width="4" stroke-linejoin="miter" stroke-opacity="0.9"/>`;
  }
  return out;
}

function stars(count: number, seed: number): string {
  const r = rng(seed);
  let out = "";
  for (let i = 0; i < count; i++) {
    out += `<circle cx="${(r() * ART_W).toFixed(1)}" cy="${(r() * ART_H * 0.75).toFixed(1)}" r="${(0.5 + r() * 1.3).toFixed(2)}" fill="white" fill-opacity="${(0.3 + r() * 0.6).toFixed(2)}"/>`;
  }
  return out;
}

function burstRays(): string {
  let out = "";
  for (let k = 0; k < 20; k++) {
    const a1 = Math.PI * 0.45 + (k / 20) * Math.PI * 1.1;
    const a2 = a1 + 0.07;
    const R = 520;
    out += `<polygon points="265,45 ${(265 + Math.cos(a1) * R).toFixed(0)},${(45 + Math.sin(a1) * R).toFixed(0)} ${(265 + Math.cos(a2) * R).toFixed(0)},${(45 + Math.sin(a2) * R).toFixed(0)}" fill="url(#ray)" opacity="${k % 2 ? 0.25 : 0.5}"/>`;
  }
  return out;
}

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
  marble: {
    nameCs: "Mramor",
    descriptionCs: "Světlý mramor se zlatými žilkami",
    css: (p) =>
      art(
        p,
        noise("v", { freq: "0.011 0.02", seed: 11, gain: -6, bias: 1.05, color: p.accent, opacity: 0.55, type: "turbulence", octaves: 4 }) +
          noise("w", { freq: "0.02 0.04", seed: 5, gain: -9, bias: 1.1, color: p.muted, opacity: 0.25, type: "turbulence", octaves: 3 })
      ),
  },
  ribbons: {
    nameCs: "Zlaté pásy",
    descriptionCs: "Šikmé kovové pásy a geometrie",
    css: (p) =>
      art(
        p,
        `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.accent2}"/><stop offset="0.5" stop-color="white" stop-opacity="0.95"/><stop offset="1" stop-color="${p.accent}"/></linearGradient></defs>` +
          `<polygon points="300,30 300,92 115,420 60,420" fill="url(#g)" opacity="0.45"/>` +
          `<polygon points="246,0 262,0 34,420 18,420" fill="url(#g)" opacity="0.85"/>` +
          `<polygon points="300,150 300,172 170,420 148,420" fill="${p.accent}" opacity="0.3"/>` +
          `<polygon points="300,0 205,0 300,118" fill="url(#g)" opacity="0.35"/>` +
          `<polyline points="186,0 236,62 300,62" fill="none" stroke="url(#g)" stroke-width="9" opacity="0.6"/>` +
          `<polyline points="214,0 250,44 300,44" fill="none" stroke="${p.accent}" stroke-width="3" opacity="0.6"/>`
      ),
  },
  streaks: {
    nameCs: "Světelné čáry",
    descriptionCs: "Jemné paprsky přes kartičku",
    css: (p) =>
      art(
        p,
        `<defs><radialGradient id="rg" cx="0.85" cy="0.12" r="0.9"><stop offset="0" stop-color="white"/><stop offset="0.75" stop-color="white" stop-opacity="0"/></radialGradient><mask id="k"><rect width="${ART_W}" height="${ART_H}" fill="url(#rg)"/></mask></defs>` +
          `<g mask="url(#k)">${streakLines()}</g>`
      ),
  },
  crystal: {
    nameCs: "Krystal",
    descriptionCs: "Velký lesklý krystal v rohu",
    css: (p) =>
      art(
        p,
        `<defs><linearGradient id="c1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="white" stop-opacity="0.95"/><stop offset="0.45" stop-color="${p.accent2}" stop-opacity="0.8"/><stop offset="1" stop-color="${p.accent}" stop-opacity="0.25"/></linearGradient><linearGradient id="c2" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.accent2}" stop-opacity="0.9"/><stop offset="1" stop-color="white" stop-opacity="0.15"/></linearGradient></defs>` +
          stars(28, 9) +
          `<polygon points="205,0 300,0 300,195 176,112" fill="url(#c1)" opacity="0.8"/>` +
          `<polygon points="176,112 300,195 300,268 232,236" fill="url(#c2)" opacity="0.55"/>` +
          `<polygon points="205,0 176,112 122,28" fill="url(#c2)" opacity="0.45"/>` +
          `<polyline points="205,0 176,112 300,195" fill="none" stroke="white" stroke-opacity="0.75" stroke-width="1.5"/>`
      ),
  },
  neonburst: {
    nameCs: "Neonový výbuch",
    descriptionCs: "Zářící neonové blesky z hráče",
    css: (p) =>
      art(
        p,
        `<defs>${GLOW_FILTER("gl", 3)}</defs><g filter="url(#gl)">${neonZigzags([p.accent2, p.accent, "oklch(0.9 0.18 100)"])}</g>`
      ),
  },
  swirl: {
    nameCs: "Holo vlny",
    descriptionCs: "Tekuté holografické vlny",
    css: (p) =>
      art(
        p,
        `<defs><filter id="sb" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="5"/></filter><linearGradient id="sg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${p.accent2}"/><stop offset="0.5" stop-color="oklch(0.85 0.12 200)"/><stop offset="1" stop-color="${p.accent2}"/></linearGradient></defs>` +
          `<g filter="url(#sb)" fill="none" stroke-linecap="round">` +
          `<path d="M-30 125 C 80 40, 170 230, 330 90" stroke="url(#sg)" stroke-width="40" opacity="0.55"/>` +
          `<path d="M-30 245 C 120 180, 200 335, 330 230" stroke="${p.accent2}" stroke-width="30" opacity="0.4"/></g>` +
          `<g fill="none" stroke-linecap="round"><path d="M-30 185 C 100 105, 180 265, 330 160" stroke="url(#sg)" stroke-width="14" opacity="0.6"/>` +
          `<path d="M-30 62 C 60 0, 200 160, 330 32" stroke="white" stroke-width="4" opacity="0.55"/>` +
          `<path d="M-30 200 C 100 120, 180 280, 330 175" stroke="white" stroke-width="1.5" opacity="0.7"/></g>`
      ),
  },
  flames: {
    nameCs: "Oheň a kouř",
    descriptionCs: "Plameny a dým zdola nahoru",
    css: (p) =>
      art(
        p,
        // Tongues: noise stretched vertically (high x / low y frequency), kept to the bottom by a
        // fading fill and to the edges by a vignette, so the centre behind the player stays calm.
        `<defs><linearGradient id="fg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${p.accent2}"/><stop offset="0.35" stop-color="${p.accent2}" stop-opacity="0.85"/><stop offset="0.7" stop-color="${p.accent}" stop-opacity="0.25"/><stop offset="1" stop-color="${p.accent}" stop-opacity="0"/></linearGradient>` +
          `<radialGradient id="fv" cx="0.5" cy="0.4" r="0.75"><stop offset="0.5" stop-color="${p.accent2}" stop-opacity="0"/><stop offset="1" stop-color="${p.accent2}" stop-opacity="0.9"/></radialGradient>` +
          `<filter id="ft" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.032 0.0065" numOctaves="3" seed="4" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 3.2 0 0 0 -0.95" result="m"/><feComposite in="SourceGraphic" in2="m" operator="in"/></filter>` +
          `<filter id="fe" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.028 0.008" numOctaves="3" seed="12" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 3 0 0 0 -0.8" result="m"/><feComposite in="SourceGraphic" in2="m" operator="in"/></filter></defs>` +
          `<rect width="${ART_W}" height="${ART_H}" fill="url(#fg)" filter="url(#ft)"/>` +
          `<rect width="${ART_W}" height="${ART_H}" fill="url(#fv)" filter="url(#fe)"/>`
      ),
  },
  grunge: {
    nameCs: "Grunge",
    descriptionCs: "Stříkance barvy a oprýskaný povrch",
    css: (p) =>
      art(
        p,
        noise("gs", { freq: "0.05", seed: 3, gain: 9, bias: -5.6, color: "black", opacity: 0.55, octaves: 2 }) +
          noise("gw", { freq: "0.035", seed: 21, gain: 8, bias: -5.4, color: "white", opacity: 0.35, octaves: 3 }) +
          noise("gr", { freq: "0.018", seed: 9, gain: 7, bias: -4.4, color: p.accent2, opacity: 0.75, octaves: 3 })
      ),
  },
  cosmos: {
    nameCs: "Vesmír",
    descriptionCs: "Mlhovina a hvězdy",
    css: (p) =>
      art(
        p,
        `<defs><filter id="nb" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="28"/></filter></defs>` +
          `<g filter="url(#nb)"><ellipse cx="80" cy="90" rx="120" ry="70" fill="${p.accent2}" opacity="0.45"/><ellipse cx="240" cy="200" rx="110" ry="90" fill="${p.accent}" opacity="0.25"/><ellipse cx="150" cy="330" rx="160" ry="60" fill="${p.accent2}" opacity="0.3"/></g>` +
          stars(55, 4)
      ),
  },
  explosion: {
    nameCs: "Exploze",
    descriptionCs: "Barevný výbuch z rohu",
    css: (p) =>
      art(
        p,
        `<defs><linearGradient id="ray" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.accent}"/><stop offset="1" stop-color="${p.accent2}" stop-opacity="0"/></linearGradient><radialGradient id="core" cx="0.88" cy="0.1" r="0.6"><stop offset="0" stop-color="white" stop-opacity="0.9"/><stop offset="0.25" stop-color="${p.accent2}" stop-opacity="0.85"/><stop offset="1" stop-color="${p.accent2}" stop-opacity="0"/></radialGradient></defs>` +
          burstRays() +
          `<rect width="${ART_W}" height="${ART_H}" fill="url(#core)"/>` +
          noise("ex", { freq: "0.03", seed: 6, gain: 6, bias: -3.6, color: p.accent2, opacity: 0.4, octaves: 2 })
      ),
  },
};

// ─── Aura, photo filter, name style ───────────────────────────────────────────

export const AURAS: Record<AuraId, { nameCs: string }> = {
  none: { nameCs: "Žádná" },
  glow: { nameCs: "Záře" },
  smoke: { nameCs: "Kouř" },
  fire: { nameCs: "Plameny" },
};

export const PHOTO_FILTERS: Record<PhotoFilterId, { nameCs: string; css?: string }> = {
  none: { nameCs: "Barevná" },
  mono: { nameCs: "Černobílá", css: "grayscale(1) contrast(1.08)" },
  warm: { nameCs: "Teplá", css: "sepia(0.3) saturate(1.25) contrast(1.05)" },
  duo: { nameCs: "Dvoubarevná", css: "grayscale(1) contrast(1.1)" },
};

export const NAME_STYLES: Record<NameStyleId, { nameCs: string }> = {
  block: { nameCs: "Klasické" },
  signature: { nameCs: "Podpis" },
  outline: { nameCs: "Obrys" },
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
  fc: { nameCs: "Herní karta", descriptionCs: "Hodnocení vlevo nahoře, jméno a 6 statistik v jedné řadě", window: false },
  pro: { nameCs: "Pro", descriptionCs: "Hodnocení a pozice vlevo nahoře, statistiky ve dvou řadách", window: false },
  classic: { nameCs: "Klasika", descriptionCs: "Fotka nahoře, jméno a statistiky dole", window: false },
  fullbleed: { nameCs: "Přes celou", descriptionCs: "Fotka přes celou kartičku, text přes ni", window: false },
  sidebar: { nameCs: "Boční pruh", descriptionCs: "Jméno svisle v barevném pruhu", window: false },
  sticker: { nameCs: "Okno", descriptionCs: "Fotka v rámečku, jméno na šikmé pásce", window: true },
  minimal: { nameCs: "Minimal", descriptionCs: "Fotka v oblouku, čistý text", window: true },
};

// ─── Sets (presets) ───────────────────────────────────────────────────────────

export type PresetTag = "zaklad" | "edice" | "specialy" | "chrome" | "legendy";

export const PRESET_TAGS: { id: PresetTag; nameCs: string }[] = [
  { id: "zaklad", nameCs: "Základ" },
  { id: "edice", nameCs: "Herní edice" },
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

// Design with the extra touches of game promo cards: aura, photo treatment, name style.
const dx = (
  base: CardDesign,
  extra: { aura?: AuraId; photoFilter?: PhotoFilterId; nameStyle?: NameStyleId }
): CardDesign => ({ ...base, ...extra });

export const PRESETS: Preset[] = [
  // Základ — the everyday ladder, free
  { id: "base-bronze", nameCs: "Bronz", descriptionCs: "Začátek sbírky", tags: ["zaklad"], requiredTier: "free", design: d("fut", "bronze", "fc", "bronze", "streaks", "gloss") },
  { id: "base-silver", nameCs: "Stříbro", descriptionCs: "Stříbrná řada", tags: ["zaklad"], requiredTier: "free", design: d("fut", "silver", "fc", "platinum", "streaks", "gloss") },
  { id: "base-gold", nameCs: "Zlato", descriptionCs: "Klasická zlatá karta", tags: ["zaklad"], requiredTier: "free", design: d("fut", "gold", "fc", "gold", "streaks", "gloss") },

  // Herní edice — inspired by current game promo cards
  { id: "ed-totw", nameCs: "Hvězda kola", descriptionCs: "Černozlatá s dvojitou linkou", tags: ["edice", "zaklad"], requiredTier: "free", design: d("crown", "doublegold", "fc", "blackgold", "streaks", "shimmer") },
  { id: "ed-legacy", nameCs: "Dědictví", descriptionCs: "Měděná s natrženým okrajem", tags: ["edice", "zaklad"], requiredTier: "free", design: d("torn", "paper", "fc", "copper", "smoke", "shimmer") },
  { id: "ed-grunge", nameCs: "Grunge", descriptionCs: "Oprýskaná šedá se stříkanci", tags: ["edice", "zaklad"], requiredTier: "free", design: d("torn", "silver", "fc", "grunge", "grunge", "none") },
  { id: "ed-icon", nameCs: "Ikona", descriptionCs: "Bílozlatá s podpisem a zlatými pásy", tags: ["edice", "legendy"], requiredTier: "premium", design: dx(d("crown", "doublegold", "fc", "icon", "ribbons", "goldglint"), { aura: "glow", photoFilter: "mono", nameStyle: "signature" }) },
  { id: "ed-icon-marble", nameCs: "Mramorová ikona", descriptionCs: "Mramor se zlatými žilkami a podpisem", tags: ["edice", "legendy"], requiredTier: "premium", design: dx(d("fut", "doublegold", "fc", "icon", "marble", "goldglint"), { photoFilter: "mono", nameStyle: "signature" }) },
  { id: "ed-future", nameCs: "Budoucí hvězdy", descriptionCs: "Fialový vesmír s krystalem", tags: ["edice"], requiredTier: "premium", design: dx(d("crown", "doublesilver", "fc", "futurestars", "crystal", "refractor"), { aura: "glow" }) },
  { id: "ed-scream", nameCs: "Ultimate Scream", descriptionCs: "Plameny a fialový kouř kolem", tags: ["edice"], requiredTier: "premium", design: dx(d("crown", "rosegold", "fc", "scream", "flames", "gloss"), { aura: "fire" }) },
  { id: "ed-ghost", nameCs: "Přízrak", descriptionCs: "Zelený přízračný oheň", tags: ["edice"], requiredTier: "premium", design: dx(d("crown", "neonline", "fc", "ghost", "flames", "refractor"), { aura: "smoke" }) },
  { id: "ed-flashback", nameCs: "Flashback", descriptionCs: "Neonové linky a neonový výbuch", tags: ["edice"], requiredTier: "premium", design: dx(d("crown", "neonline", "fc", "flashback", "neonburst", "none"), { aura: "glow" }) },
  { id: "ed-hero", nameCs: "Hrdina", descriptionCs: "Holografické vlny a zlaté písmo", tags: ["edice"], requiredTier: "premium", design: dx(d("crown", "doublesilver", "fc", "hero", "swirl", "refractor"), { aura: "glow" }) },
  { id: "ed-trailblazer", nameCs: "Průkopník", descriptionCs: "Tyrkys s oranžovou explozí", tags: ["edice"], requiredTier: "premium", design: d("torn", "gold", "fc", "trailblazer", "explosion", "refractor") },
  { id: "ed-champion", nameCs: "Fialový šampion", descriptionCs: "Stříbrné sloupky a ametyst", tags: ["edice"], requiredTier: "premium", design: d("pillar", "doublesilver", "fc", "amethyst", "crystal", "shimmer") },
  { id: "ed-highlights", nameCs: "Zajímaví hráči", descriptionCs: "Duhový okraj a světelné čáry", tags: ["edice"], requiredTier: "premium", design: dx(d("fut", "chrome", "fc", "aqua", "streaks", "refractor"), { aura: "glow" }) },
  { id: "ed-cosmic", nameCs: "Vesmírná", descriptionCs: "Mlhovina, hvězdy a neon", tags: ["edice"], requiredTier: "premium", design: d("crown", "neonline", "fc", "futurestars", "cosmos", "shimmer") },
  { id: "ed-blaze", nameCs: "Plamenný", descriptionCs: "Ohnivá karta v kouři", tags: ["edice"], requiredTier: "premium", design: dx(d("fut", "rosegold", "fc", "scream", "flames", "shimmer"), { aura: "smoke", photoFilter: "warm" }) },
  { id: "totw", nameCs: "Černé zlato", descriptionCs: "Černozlatá karta za skvělý výkon", tags: ["zaklad", "specialy"], requiredTier: "free", design: d("elite", "gold", "pro", "blackgold", "facets", "shimmer") },
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
  const aura = design.aura && AURAS[design.aura] ? design.aura : undefined;
  const photoFilter = design.photoFilter && PHOTO_FILTERS[design.photoFilter] ? design.photoFilter : undefined;
  const nameStyle = design.nameStyle && NAME_STYLES[design.nameStyle] ? design.nameStyle : undefined;
  return { ...design, shape, frame, pattern, finish, palette, layout, aura, photoFilter, nameStyle };
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

// ─── Flag & club crest placement ──────────────────────────────────────────────

export const BADGE_PLACEMENTS: Record<BadgePlacementId, { nameCs: string; layouts?: LayoutId[] }> = {
  bottom: { nameCs: "Dole", layouts: ["fc"] },
  rating: { nameCs: "U hodnocení", layouts: ["fc", "pro"] },
  topRight: { nameCs: "Vpravo nahoře" },
  photo: { nameCs: "V rozích fotky" },
};

export function badgePlacementsFor(layout: LayoutId): BadgePlacementId[] {
  return (Object.keys(BADGE_PLACEMENTS) as BadgePlacementId[]).filter((id) => {
    const only = BADGE_PLACEMENTS[id].layouts;
    return !only || only.includes(layout);
  });
}

const DEFAULT_PLACEMENT: Partial<Record<LayoutId, BadgePlacementId>> = { fc: "bottom", pro: "rating" };

// The card's own choice, falling back to a spot the current layout supports
// (a preset change can switch to a layout without e.g. a bottom row).
export function resolveBadges(badges: CardBadges | undefined, layout: LayoutId): CardBadges {
  const fallback = DEFAULT_PLACEMENT[layout] ?? "topRight";
  const placement = badges && badgePlacementsFor(layout).includes(badges.placement) ? badges.placement : fallback;
  return {
    flag: badges?.flag ?? true,
    crest: badges?.crest ?? true,
    placement,
    flagShape: badges?.flagShape ?? "rect",
  };
}