// Visual style of a card template. Keyed by Template.category; cards store the key as
// Card.templateStyle so every view can render them without loading the template doc.

export interface TemplateStyle {
  frame: string; // CSS background of the outer frame
  body: string; // CSS background of the card face
  sheen?: string; // optional overlay on the face (holographic shine)
  name: string; // player name colour
  nameShadow?: string;
  jersey?: string; // jersey number on the photo area; defaults to `name`
  text: string; // primary text on the face
  muted: string; // secondary text on the face
  infoBg?: string; // band behind the name/stats area
  statBg: string;
}

export const TEMPLATE_STYLES: Record<string, TemplateStyle> = {
  classic: {
    frame:
      "linear-gradient(145deg, oklch(0.88 0.12 90), oklch(0.66 0.15 70) 45%, oklch(0.84 0.13 85) 70%, oklch(0.55 0.13 60))",
    body: "linear-gradient(170deg, oklch(0.25 0.03 70), oklch(0.15 0.02 60))",
    name: "oklch(0.86 0.14 85)",
    text: "oklch(0.96 0.01 85)",
    muted: "oklch(0.76 0.04 80)",
    statBg: "oklch(0.86 0.14 85 / 0.14)",
  },
  dark: {
    frame:
      "linear-gradient(145deg, oklch(0.78 0.01 250), oklch(0.42 0.01 250) 50%, oklch(0.68 0.01 250))",
    body: "repeating-linear-gradient(135deg, oklch(0.21 0.01 250) 0 6px, oklch(0.18 0.01 250) 6px 12px)",
    name: "oklch(0.93 0.01 250)",
    text: "oklch(0.95 0.005 250)",
    muted: "oklch(0.7 0.01 250)",
    statBg: "oklch(0.93 0.01 250 / 0.1)",
  },
  neon: {
    frame: "linear-gradient(145deg, oklch(0.82 0.15 200), oklch(0.62 0.27 330))",
    body: "radial-gradient(circle at 50% 0%, oklch(0.3 0.09 300), oklch(0.12 0.03 280) 70%)",
    name: "oklch(0.88 0.14 200)",
    nameShadow: "0 0 0.5em oklch(0.8 0.15 200)",
    text: "oklch(0.96 0.02 300)",
    muted: "oklch(0.75 0.08 300)",
    statBg: "oklch(0.82 0.15 200 / 0.14)",
  },
  retro: {
    frame: "linear-gradient(145deg, oklch(0.6 0.11 40), oklch(0.48 0.1 35))",
    body: "oklch(0.94 0.03 85)",
    name: "oklch(0.98 0.02 85)",
    jersey: "oklch(0.45 0.11 35)",
    text: "oklch(0.25 0.03 50)",
    muted: "oklch(0.88 0.04 70)",
    infoBg: "oklch(0.52 0.12 30)",
    statBg: "oklch(0.98 0.02 85 / 0.18)",
  },
  holographic: {
    frame:
      "conic-gradient(from 210deg, oklch(0.85 0.12 330), oklch(0.85 0.12 250), oklch(0.88 0.12 200), oklch(0.9 0.14 130), oklch(0.9 0.14 85), oklch(0.85 0.12 330))",
    body: "linear-gradient(160deg, oklch(0.26 0.05 280), oklch(0.18 0.04 220))",
    sheen:
      "linear-gradient(120deg, transparent 25%, oklch(1 0 0 / 0.14) 42%, oklch(0.9 0.12 200 / 0.12) 50%, transparent 65%)",
    name: "oklch(0.93 0.07 300)",
    text: "oklch(0.96 0.02 280)",
    muted: "oklch(0.78 0.06 260)",
    statBg: "oklch(0.93 0.07 300 / 0.14)",
  },
};

export const DEFAULT_TEMPLATE_STYLE = "classic";

// Cards created before templateStyle existed only carry the seeded template id.
const SEEDED_TEMPLATE_IDS: Record<string, string> = {
  "classic-gold": "classic",
  "dark-steel": "dark",
  "neon-strike": "neon",
  "retro-panini": "retro",
  "holographic-elite": "holographic",
};

export function resolveTemplateStyle(opts: {
  category?: string;
  templateStyle?: string;
  templateId?: string;
}): TemplateStyle {
  const key =
    [opts.category, opts.templateStyle, SEEDED_TEMPLATE_IDS[opts.templateId ?? ""]].find(
      (k) => k && TEMPLATE_STYLES[k]
    ) ?? DEFAULT_TEMPLATE_STYLE;
  return TEMPLATE_STYLES[key];
}
