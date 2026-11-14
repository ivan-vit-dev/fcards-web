// Country flags for every country, from the `country-flag-icons` package (MIT). The 3:2 SVGs are
// copied to /public/flags so each card loads only the one flag it shows instead of bundling all
// 265. Czech country names come from the browser's built-in Intl.DisplayNames.

import { countries } from "country-flag-icons";
import { cn } from "@/lib/utils";
import type { FlagShapeId } from "@/types";

// Football has home nations; Intl doesn't name these subdivisions.
const SUBDIVISION_NAMES: Record<string, string> = {
  "GB-ENG": "Anglie",
  "GB-SCT": "Skotsko",
  "GB-WLS": "Wales",
  "GB-NIR": "Severní Irsko",
};

// Codes that aren't a "nationality" for a player card.
const EXCLUDED = new Set(["EU", "UN", "BQ-BO", "BQ-SA", "BQ-SE", "ES-CT"]);

// Earlier versions stored "EN" for England.
const LEGACY: Record<string, string> = { EN: "GB-ENG" };

// Shown first in pickers: Czech players' most likely nationalities and neighbours.
const COMMON = ["CZ", "SK", "PL", "DE", "AT", "UA", "HU", "GB-ENG"];

let regionNames: Intl.DisplayNames | null = null;

export function countryName(code?: string): string | undefined {
  if (!code) return undefined;
  const c = LEGACY[code] ?? code;
  if (SUBDIVISION_NAMES[c]) return SUBDIVISION_NAMES[c];
  try {
    regionNames ??= new Intl.DisplayNames(["cs"], { type: "region" });
    return regionNames.of(c) ?? c;
  } catch {
    return c;
  }
}

export const COUNTRIES: { code: string; nameCs: string }[] = (() => {
  const all = countries
    .filter((c) => !EXCLUDED.has(c))
    .map((code) => ({ code, nameCs: countryName(code) ?? code }));
  const common = COMMON.flatMap((code) => all.filter((c) => c.code === code));
  const rest = all
    .filter((c) => !COMMON.includes(c.code))
    .sort((a, b) => a.nameCs.localeCompare(b.nameCs, "cs"));
  return [...common, ...rest];
})();

// Shapes the flag can be cut into on a card. `aspect` is width / height; square-ish shapes get a
// smaller width (`scale`) so they carry about the same visual weight as the 3:2 rectangle.
export const FLAG_SHAPES: Record<
  FlagShapeId,
  { nameCs: string; aspect: string; scale: number; radius?: string; clip?: string }
> = {
  rect: { nameCs: "Obdélník", aspect: "3 / 2", scale: 1, radius: "8%" },
  rounded: { nameCs: "Zaoblená", aspect: "3 / 2", scale: 1, radius: "28% / 40%" },
  circle: { nameCs: "Kolečko", aspect: "1", scale: 0.78, radius: "50%" },
  square: { nameCs: "Čtverec", aspect: "1", scale: 0.75, radius: "12%" },
  shield: {
    nameCs: "Štít",
    aspect: "5 / 6",
    scale: 0.72,
    clip: "polygon(0 0, 100% 0, 100% 52%, 96% 68%, 86% 82%, 70% 93%, 50% 100%, 30% 93%, 14% 82%, 4% 68%, 0 52%)",
  },
  hexagon: {
    nameCs: "Šestiúhelník",
    aspect: "1",
    scale: 0.8,
    clip: "polygon(25% 3%, 75% 3%, 100% 50%, 75% 97%, 25% 97%, 0 50%)",
  },
  wave: {
    nameCs: "Vlající",
    aspect: "3 / 2",
    scale: 1.05,
    clip: `polygon(${Array.from({ length: 11 }, (_, i) => `${i * 10}% ${(6 + Math.sin((i / 10) * Math.PI * 2) * 6).toFixed(1)}%`).join(", ")}, ${Array.from(
      { length: 11 },
      (_, i) => `${100 - i * 10}% ${(94 + Math.sin(((10 - i) / 10) * Math.PI * 2) * 6).toFixed(1)}%`
    ).join(", ")})`,
  },
  pennant: { nameCs: "Vlaječka", aspect: "3 / 2", scale: 1.05, clip: "polygon(0 0, 100% 50%, 0 100%)" },
};

export function Flag({
  code = "CZ",
  shape = "rect",
  className,
  style,
}: {
  code?: string;
  shape?: FlagShapeId;
  className?: string;
  style?: React.CSSProperties;
}) {
  const c = LEGACY[code] ?? code;
  const known = countries.includes(c) ? c : "CZ";
  const s = FLAG_SHAPES[shape] ?? FLAG_SHAPES.rect;
  const { width, filter, ...rest } = style ?? {};
  const w = typeof width === "number" ? `${width}px` : width;
  return (
    // Outer span carries the shadow: a clip-path on the same element would cut it off.
    <span
      className={cn("inline-block shrink-0", className)}
      title={countryName(known)}
      style={{
        width: w ? `calc(${w} * ${s.scale})` : undefined,
        filter: filter ?? "drop-shadow(0 0.5px 1px oklch(0 0 0 / 0.45))",
        ...rest,
        borderRadius: undefined,
      }}
    >
      <span
        className="relative block overflow-hidden"
        style={{ aspectRatio: s.aspect, borderRadius: s.radius, clipPath: s.clip }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/flags/${known}.svg`}
          alt={countryName(known)}
          className="block h-full w-full object-cover"
        />
        {/* Folds of a waving flag */}
        {shape === "wave" && (
          <span
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, oklch(0 0 0 / 0.18), oklch(1 0 0 / 0.18) 22%, oklch(0 0 0 / 0.16) 48%, oklch(1 0 0 / 0.16) 74%, oklch(0 0 0 / 0.14))",
            }}
          />
        )}
      </span>
    </span>
  );
}
