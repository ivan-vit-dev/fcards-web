"use client";

import { useRef, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { cn, getRarityColor } from "@/lib/utils";
import {
  FINISHES,
  FRAMES,
  GRAIN,
  PATTERNS,
  SHAPES,
  resolveDesign,
  resolvePalette,
  shapeClipPath,
  type Palette,
} from "@/lib/cardDesign";
import { RarityBadge } from "./RarityBadge";
import type { Card, CardDesign, CardStats, Player, PlayerPosition } from "@/types";

const cardTypeLabels: Record<string, string> = {
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

const POSITION_ABBR: Record<PlayerPosition, string> = {
  goalkeeper: "BR",
  defender: "OB",
  midfielder: "ZÁ",
  forward: "ÚT",
};

const STAT_LABELS: [keyof CardStats, string][] = [
  ["goals", "GÓL"],
  ["assists", "ASI"],
  ["rating", "HOD"],
  ["saves", "ZÁK"],
  ["cleanSheets", "ČK"],
  ["pace", "RYC"],
  ["shooting", "STŘ"],
  ["passing", "PŘI"],
  ["dribbling", "DRI"],
  ["defending", "OBR"],
  ["physical", "FYZ"],
];

// Width, height (5:7) and base font size; everything inside scales with em / %.
const SIZES = {
  sm: { w: 120, h: 168, font: 8 },
  md: { w: 210, h: 294, font: 11 },
  lg: { w: 280, h: 392, font: 13 },
  xl: { w: 360, h: 504, font: 16 },
} as const;

export type CardSize = keyof typeof SIZES;

interface CardPreviewProps {
  card: Card;
  player?: Player;
  /** Overrides the card's own design — used by galleries and the editor preview. */
  design?: CardDesign;
  size?: CardSize;
  /** No rarity glow — for print, where it would show as a halo around non-rectangular shapes. */
  flat?: boolean;
  /** Tilts toward the pointer with a moving glare, like a real foil card in your hand. */
  interactive?: boolean;
  className?: string;
  onClick?: () => void;
}

interface LayoutProps {
  p: Palette;
  safeTop: number;
  safeBottom: number;
  name: string;
  position?: string;
  jersey?: number;
  typeLine: string;
  stats: { label: string; value: number }[];
  overall?: number;
  rarity: Card["rarity"];
  photo: ReactNode; // photo + stadium filling its container
  photoUrl?: string;
  backgroundUrl?: string;
  popOut: boolean;
  cutout: boolean;
}

const MAX_TILT = 14; // degrees

// The design decides shape, frame, layout, colours, background and finish; rarity adds badge + glow.
export function CardPreview({
  card,
  player,
  design: designOverride,
  size = "md",
  flat,
  interactive,
  className,
  onClick,
}: CardPreviewProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const design = resolveDesign({ design: designOverride ?? card.design, templateId: card.templateId, templateStyle: card.templateStyle });
  const p = resolvePalette(design);
  const shape = SHAPES[design.shape];
  const frame = FRAMES[design.frame];
  const finish = FINISHES[design.finish];
  const dims = SIZES[size];

  const clipPath = shapeClipPath(design.shape);
  const radius = shape.radius !== undefined ? shape.radius * dims.w : 0;
  const thickness = Math.max(1.5, frame.thickness * dims.w);
  const rarityColor = getRarityColor(card.rarity);
  const glow = card.rarity === "legendary" || card.rarity === "mythic" ? 50 : 24;

  const name = player?.displayName ?? card.playerName ?? "Hráč";
  const photoUrl = card.photoUrl ?? player?.photoURL;
  const stats = STAT_LABELS.flatMap(([key, label]) => {
    const value = card.cardStats?.[key];
    return typeof value === "number" ? [{ label, value }] : [];
  });

  const layoutProps: LayoutProps = {
    p,
    safeTop: shape.safeTop,
    safeBottom: shape.safeBottom,
    name,
    position: player?.position ? POSITION_ABBR[player.position] : undefined,
    jersey: player?.jerseyNumber,
    typeLine: [cardTypeLabels[card.cardType] ?? card.cardType, card.season].filter(Boolean).join(" · "),
    stats,
    overall: card.cardStats?.overall || undefined,
    rarity: card.rarity,
    photo: (
      <PhotoLayer
        photo={photoUrl}
        background={card.backgroundUrl}
        alt={name}
        accent={p.accent}
        cutout={!!card.photoUrl && !!card.photoCutout}
      />
    ),
    cutout: !!card.photoUrl && !!card.photoCutout,
    photoUrl,
    backgroundUrl: card.backgroundUrl,
    popOut: !!design.popOut,
  };

  const Layout = LAYOUT_COMPONENTS[design.layout] ?? ClassicLayout;

  // Pointer → CSS custom properties (registered in globals.css so they animate smoothly).
  const handleMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    el.dataset.tilting = "";
    el.style.setProperty("--rx", `${(x - 0.5) * 2 * MAX_TILT}deg`);
    el.style.setProperty("--ry", `${(0.5 - y) * 2 * MAX_TILT}deg`);
    el.style.setProperty("--gx", `${x * 100}%`);
    el.style.setProperty("--gy", `${y * 100}%`);
    el.style.setProperty("--glare", "1");
  };
  const handleLeave = () => {
    const el = rootRef.current;
    if (!el) return;
    delete el.dataset.tilting;
    for (const prop of ["--rx", "--ry", "--gx", "--gy", "--glare"]) el.style.removeProperty(prop);
  };

  return (
    <div
      ref={rootRef}
      onClick={onClick}
      onPointerMove={interactive ? handleMove : undefined}
      onPointerLeave={interactive ? handleLeave : undefined}
      data-interactive={interactive ? "" : undefined}
      className={cn("card-design relative flex-shrink-0 select-none", onClick && "cursor-pointer", className)}
      style={{
        width: dims.w,
        height: dims.h,
        fontSize: dims.font,
        transform: interactive ? "perspective(900px) rotateY(var(--rx)) rotateX(var(--ry))" : undefined,
        touchAction: interactive ? "pan-y" : undefined,
        filter: flat
          ? undefined
          : `drop-shadow(0 ${dims.w * 0.015}px ${dims.w * 0.05}px color-mix(in oklch, ${rarityColor} ${glow}%, transparent))`,
      }}
    >
      {/* Frame */}
      <div className="absolute inset-0" style={{ background: frame.background(p), clipPath, borderRadius: radius }} />

      {/* Face */}
      <div
        className="absolute overflow-hidden"
        style={{
          inset: thickness,
          clipPath,
          borderRadius: Math.max(0, radius - thickness),
          background: PATTERNS[design.pattern].css(p),
          color: p.text,
        }}
      >
        {design.pattern === "number" && (
          <BigNumber value={player?.jerseyNumber ?? initials(name)} p={p} top={shape.safeTop} />
        )}

        <Layout {...layoutProps} />

        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: GRAIN, backgroundSize: "160px 160px", mixBlendMode: "overlay", opacity: 0.35 }}
        />

        {finish.image && (
          <div
            className="card-finish absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: finish.image,
              backgroundSize: finish.size,
              backgroundPosition: "var(--gx) var(--gy)",
              mixBlendMode: finish.blend as CSSProperties["mixBlendMode"],
              opacity: finish.opacity,
            }}
          />
        )}

        {interactive && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(circle at var(--gx) var(--gy), oklch(1 0 0 / 0.5), oklch(1 0 0 / 0.08) 35%, transparent 60%)",
              mixBlendMode: "overlay",
              opacity: "var(--glare)",
            }}
          />
        )}

        {(card.aiStatus === "pending" || card.aiStatus === "processing") && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/60">
            <div className="text-center space-y-1">
              <div
                className="h-6 w-6 rounded-full border-2 border-t-transparent animate-spin mx-auto"
                style={{ borderColor: rarityColor }}
              />
              <p className="text-[0.8em] text-muted-foreground">Generuji…</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Building blocks ──────────────────────────────────────────────────────────

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// A cut-out player (background removed) casts a soft shadow so it sits *in* the scene
// instead of looking pasted on; the edge itself is feathered server-side.
const CUTOUT_SHADOW = "drop-shadow(0 0.35em 0.6em oklch(0 0 0 / 0.5)) drop-shadow(0 0 0.15em oklch(0 0 0 / 0.25))";

function PhotoLayer({
  photo,
  background,
  alt,
  accent,
  cutout,
  placeholder = true,
  className,
  style,
}: {
  photo?: string;
  background?: string;
  alt: string;
  accent: string;
  cutout?: boolean;
  placeholder?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)} style={style}>
      {background && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={background} alt="" className="absolute inset-0 w-full h-full object-cover" />
      )}
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo}
          alt={alt}
          className="relative w-full h-full object-cover object-top"
          style={cutout ? { filter: CUTOUT_SHADOW } : undefined}
        />
      ) : (
        placeholder &&
        !background && (
          <div className="w-full h-full flex items-end justify-center">
            {/* Silhouette placeholder */}
            <svg viewBox="0 0 100 100" className="w-3/5 opacity-25" fill={accent} aria-hidden>
              <circle cx="50" cy="32" r="18" />
              <path d="M14 100c0-22 16-38 36-38s36 16 36 38z" />
            </svg>
          </div>
        )
      )}
    </div>
  );
}

// Giant outlined jersey number behind the player — the signature of current matchday graphics.
function BigNumber({ value, p, top }: { value: number | string; p: Palette; top: number }) {
  return (
    <div
      className="absolute inset-x-0 text-center font-display font-bold leading-none pointer-events-none select-none"
      style={{
        top: `${top + 4}%`,
        fontSize: String(value).length > 1 ? "10em" : "12em",
        color: `color-mix(in oklch, ${p.accent} 10%, transparent)`,
        WebkitTextStroke: `0.012em color-mix(in oklch, ${p.accent} 60%, transparent)`,
        letterSpacing: "-0.04em",
      }}
    >
      {value}
    </div>
  );
}

const shade = "0 1px 2px oklch(0 0 0 / 0.55)";

function Badge({ rarity, top, left = "5%", right }: { rarity: Card["rarity"]; top: number; left?: string; right?: string }) {
  return (
    <div className="absolute z-20" style={{ top: `${top}%`, left: right ? undefined : left, right }}>
      <RarityBadge rarity={rarity} variant="solid" className="text-[0.7em] px-[0.5em] py-0 uppercase tracking-wide" />
    </div>
  );
}

function StatCell({ value, label, p, boxed }: { value: number; label: string; p: Palette; boxed?: boolean }) {
  return (
    <div
      className="text-center rounded"
      style={{ background: boxed ? `color-mix(in oklch, ${p.accent} 14%, transparent)` : undefined, padding: "0.2em 0" }}
    >
      <p className="font-display font-bold leading-none" style={{ fontSize: "1.2em" }}>
        {value}
      </p>
      <p className="leading-none mt-[0.15em]" style={{ fontSize: "0.65em", color: p.muted }}>
        {label}
      </p>
    </div>
  );
}

function splitName(name: string): [string, string] {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return ["", name];
  return [parts.slice(0, -1).join(" "), parts[parts.length - 1]];
}

// A photo window; with popOut the player is drawn taller than the window so the head
// breaks out over its top edge (best with a background-removed photo).
function PhotoWindow({
  props,
  box,
  windowStyle,
}: {
  props: LayoutProps;
  box: { left: string; right: string; top: number; height: number };
  windowStyle: CSSProperties;
}) {
  const { p, photo, photoUrl, backgroundUrl, popOut, cutout, name } = props;
  const frameBox = { left: box.left, right: box.right, top: `${box.top}%`, height: `${box.height}%` };
  if (!popOut) {
    return (
      <div className="absolute overflow-hidden" style={{ ...frameBox, ...windowStyle }}>
        {photo}
      </div>
    );
  }
  const lift = 9; // % of card height the player rises above the window
  return (
    <>
      <div className="absolute overflow-hidden" style={{ ...frameBox, ...windowStyle }}>
        <PhotoLayer background={backgroundUrl} alt="" accent={p.accent} placeholder={false} />
      </div>
      <PhotoLayer
        photo={photoUrl}
        alt={name}
        accent={p.accent}
        cutout={cutout}
        className="z-10"
        style={{
          left: box.left,
          right: box.right,
          top: `${box.top - lift}%`,
          height: `${box.height + lift}%`,
          bottom: "auto",
          borderBottomLeftRadius: windowStyle.borderRadius,
          borderBottomRightRadius: windowStyle.borderRadius,
        }}
      />
    </>
  );
}

// ─── Layouts ──────────────────────────────────────────────────────────────────

// Photo on top, name + stats in a band below.
function ClassicLayout({ p, safeTop, safeBottom, name, jersey, typeLine, stats, rarity, photo }: LayoutProps) {
  return (
    <div className="absolute inset-0 flex flex-col">
      <div className="flex-1 relative">
        {photo}
        <div
          className="absolute bottom-0 inset-x-0 h-1/3"
          style={{ background: `linear-gradient(to top, ${p.bg2}, transparent)` }}
        />
      </div>
      <div className="px-[8%] pt-[0.4em] pb-[0.6em] space-y-[0.4em]">
        <div>
          <p
            className="font-display font-bold uppercase leading-tight truncate tracking-wide"
            style={{ fontSize: "1.3em", color: p.accent }}
          >
            {name}
          </p>
          <p className="leading-none truncate" style={{ fontSize: "0.75em", color: p.muted }}>
            {typeLine}
          </p>
        </div>
        {stats.length > 0 && (
          <div className="grid grid-cols-3 gap-[0.3em]">
            {stats.slice(0, 3).map((s) => (
              <StatCell key={s.label} {...s} p={p} boxed />
            ))}
          </div>
        )}
      </div>
      <div className="flex-none" style={{ height: `${safeBottom}%` }} />
      <Badge rarity={rarity} top={safeTop + 4} />
      {jersey !== undefined && (
        <div
          className="absolute z-20 font-display font-bold leading-none"
          style={{ top: `${safeTop + 4}%`, right: "6%", fontSize: "1.4em", color: p.accent, textShadow: shade }}
        >
          {jersey}
        </div>
      )}
    </div>
  );
}

// Game-card style: rating column top-left, name, two rows of stats.
function ProLayout({ p, safeTop, safeBottom, name, position, jersey, typeLine, stats, overall, rarity, photo }: LayoutProps) {
  const shown = stats.slice(0, 6);
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-x-0 top-0" style={{ height: "64%" }}>
        {photo}
        <div
          className="absolute bottom-0 inset-x-0 h-2/5"
          style={{ background: `linear-gradient(to top, ${p.bg2}, transparent)` }}
        />
      </div>

      <div
        className="absolute z-20 flex flex-col items-center leading-none"
        style={{ top: `${safeTop + 5}%`, left: "7%", color: p.accent, textShadow: shade }}
      >
        {overall !== undefined && (
          <span className="font-display font-bold" style={{ fontSize: "2.5em" }}>
            {overall}
          </span>
        )}
        {position && (
          <span className="font-display font-semibold mt-[0.1em]" style={{ fontSize: "0.95em" }}>
            {position}
          </span>
        )}
        {jersey !== undefined && (
          <span className="font-display mt-[0.3em] pt-[0.2em] border-t" style={{ fontSize: "0.8em", borderColor: p.accent }}>
            {jersey}
          </span>
        )}
      </div>
      <Badge rarity={rarity} top={safeTop + 4} right="6%" />

      <p
        className="absolute inset-x-[6%] text-center font-display font-bold uppercase leading-tight truncate tracking-wide"
        style={{ top: "62.5%", fontSize: "1.35em", color: p.accent }}
      >
        {name}
      </p>
      <div
        className="absolute inset-x-[22%] h-px"
        style={{ top: "71%", background: `linear-gradient(90deg, transparent, ${p.accent}, transparent)` }}
      />

      <div
        className="absolute inset-x-[9%] flex flex-col justify-center gap-[0.35em]"
        style={{ top: "72.5%", bottom: `${safeBottom + 3}%` }}
      >
        {shown.length > 0 && (
          <div className="grid grid-cols-3 gap-x-[0.6em] gap-y-[0.25em]">
            {shown.map((s) => (
              <div key={s.label} className="flex items-baseline justify-center gap-[0.25em]">
                <span className="font-display font-bold" style={{ fontSize: "1.15em" }}>
                  {s.value}
                </span>
                <span style={{ fontSize: "0.65em", color: p.muted }}>{s.label}</span>
              </div>
            ))}
          </div>
        )}
        <p className="text-center leading-none truncate" style={{ fontSize: "0.65em", color: p.muted }}>
          {typeLine}
        </p>
      </div>
    </div>
  );
}

// Photo in a framed window, name on a slanted ribbon.
function StickerLayout(props: LayoutProps) {
  const { p, safeTop, safeBottom, name, position, jersey, typeLine, stats, rarity } = props;
  return (
    <div className="absolute inset-0">
      <PhotoWindow
        props={props}
        box={{ left: "7%", right: "7%", top: safeTop + 9, height: 100 - safeTop - safeBottom - 9 - 27 }}
        windowStyle={{
          borderRadius: "0.5em",
          boxShadow: `inset 0 0 0 0.15em ${p.accent}`,
          background: `color-mix(in oklch, ${p.accent} 14%, ${p.bg2})`,
        }}
      />
      <Badge rarity={rarity} top={safeTop + 3} left="7%" />
      {jersey !== undefined && (
        <div
          className="absolute z-20 flex items-center justify-center rounded-full font-display font-bold"
          style={{
            top: `${safeTop + 3}%`,
            right: "4%",
            width: "2.3em",
            height: "2.3em",
            background: p.accent,
            color: p.bg2,
            boxShadow: "0 1px 4px oklch(0 0 0 / 0.35)",
          }}
        >
          {jersey}
        </div>
      )}
      <div
        className="absolute z-20 text-center font-display font-bold uppercase truncate"
        style={{
          left: "-3%",
          right: "-3%",
          bottom: `${safeBottom + 17}%`,
          transform: "rotate(-4deg)",
          background: `linear-gradient(90deg, ${p.accent}, ${p.accent2})`,
          color: p.bg2,
          fontSize: "1.25em",
          padding: "0.25em 1.2em",
          letterSpacing: "0.04em",
        }}
      >
        {name}
      </div>
      <div className="absolute inset-x-[7%] text-center space-y-[0.3em]" style={{ bottom: `${safeBottom + 3.5}%` }}>
        <p className="leading-none truncate" style={{ fontSize: "0.72em", color: p.muted }}>
          {[position, typeLine].filter(Boolean).join(" · ")}
        </p>
        {stats.length > 0 && (
          <p className="leading-none" style={{ fontSize: "0.85em" }}>
            {stats.slice(0, 3).map((s, i) => (
              <span key={s.label}>
                {i > 0 && <span style={{ color: p.muted }}> · </span>}
                <b className="font-display">{s.value}</b> <span style={{ color: p.muted, fontSize: "0.8em" }}>{s.label}</span>
              </span>
            ))}
          </p>
        )}
      </div>
    </div>
  );
}

// Photo across the whole face, text over it.
function FullbleedLayout({ p, safeTop, safeBottom, name, position, typeLine, stats, overall, rarity, photo }: LayoutProps) {
  const [first, last] = splitName(name);
  return (
    <div className="absolute inset-0">
      {photo}
      <div className="absolute inset-x-0 top-0 h-1/4" style={{ background: "linear-gradient(to bottom, oklch(0 0 0 / 0.45), transparent)" }} />
      <div className="absolute inset-x-0 bottom-0 h-3/5" style={{ background: `linear-gradient(to top, ${p.bg2} 15%, transparent)` }} />

      <Badge rarity={rarity} top={safeTop + 4} />
      {(overall !== undefined || position) && (
        <div
          className="absolute z-20 text-center rounded-md leading-none"
          style={{
            top: `${safeTop + 4}%`,
            right: "5%",
            padding: "0.3em 0.45em",
            background: "oklch(0 0 0 / 0.38)",
            border: `1px solid color-mix(in oklch, ${p.accent} 50%, transparent)`,
            color: p.accent,
          }}
        >
          {overall !== undefined && <p className="font-display font-bold" style={{ fontSize: "1.5em" }}>{overall}</p>}
          {position && <p className="font-display" style={{ fontSize: "0.75em" }}>{position}</p>}
        </div>
      )}

      <div className="absolute left-[7%] right-[7%]" style={{ bottom: `${safeBottom + 17}%` }}>
        {first && (
          <p className="leading-none truncate" style={{ fontSize: "0.85em", color: p.muted }}>
            {first}
          </p>
        )}
        <p
          className="font-display font-bold uppercase leading-none truncate"
          style={{ fontSize: "1.75em", color: p.accent, textShadow: shade }}
        >
          {last}
        </p>
      </div>
      <p
        className="absolute left-[7%] right-[7%] leading-none truncate"
        style={{ bottom: `${safeBottom + 12.5}%`, fontSize: "0.7em", color: p.muted }}
      >
        {typeLine}
      </p>
      {stats.length > 0 && (
        <div
          className="absolute left-[6%] right-[6%] grid grid-cols-3 rounded-md"
          style={{ bottom: `${safeBottom + 3.5}%`, background: "oklch(0 0 0 / 0.32)", padding: "0.15em 0" }}
        >
          {stats.slice(0, 3).map((s) => (
            <StatCell key={s.label} {...s} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}

// Vertical name in a coloured band on the left.
function SidebarLayout({ p, safeTop, safeBottom, name, position, jersey, typeLine, stats, rarity, photo }: LayoutProps) {
  return (
    <div className="absolute inset-0">
      <div
        className="absolute left-0 top-0 bottom-0 w-[22%] flex flex-col items-center"
        style={{ background: `linear-gradient(180deg, ${p.accent}, ${p.accent2})`, color: p.bg2 }}
      >
        <div className="flex-none" style={{ height: `${safeTop + 4}%` }} />
        {jersey !== undefined && (
          <p className="font-display font-bold leading-none" style={{ fontSize: "1.5em" }}>
            {jersey}
          </p>
        )}
        <p
          className="flex-1 font-display font-bold uppercase tracking-wider truncate text-center"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontSize: "1.35em", padding: "0.6em 0" }}
        >
          {name}
        </p>
        <div style={{ height: `${safeBottom}%` }} />
      </div>
      <div className="absolute right-0 top-0 left-[22%]" style={{ bottom: `${safeBottom + 24}%` }}>
        {photo}
        <div className="absolute bottom-0 inset-x-0 h-1/4" style={{ background: `linear-gradient(to top, ${p.bg2}, transparent)` }} />
      </div>
      <Badge rarity={rarity} top={safeTop + 4} right="5%" />
      <div className="absolute left-[27%] right-[5%] space-y-[0.4em]" style={{ bottom: `${safeBottom + 4}%` }}>
        <p className="leading-none truncate" style={{ fontSize: "0.72em", color: p.muted }}>
          {[position, typeLine].filter(Boolean).join(" · ")}
        </p>
        {stats.length > 0 && (
          <div className="grid grid-cols-3 gap-[0.3em]">
            {stats.slice(0, 3).map((s) => (
              <StatCell key={s.label} {...s} p={p} boxed />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Photo in an arched window, clean centred text.
function MinimalLayout(props: LayoutProps) {
  const { p, safeTop, safeBottom, name, position, jersey, typeLine, stats, rarity } = props;
  return (
    <div className="absolute inset-0">
      <PhotoWindow
        props={props}
        box={{ left: "14%", right: "14%", top: safeTop + 10, height: 48 }}
        windowStyle={{
          borderRadius: "50% 50% 0.5em 0.5em / 32% 32% 0.5em 0.5em",
          background: `color-mix(in oklch, ${p.accent} 14%, ${p.bg2})`,
          boxShadow: `inset 0 0 0 1px color-mix(in oklch, ${p.accent} 45%, transparent)`,
        }}
      />
      <Badge rarity={rarity} top={safeTop + 3} />
      {jersey !== undefined && (
        <div
          className="absolute z-20 font-display font-bold leading-none"
          style={{ top: `${safeTop + 3}%`, right: "6%", fontSize: "1.2em", color: p.accent }}
        >
          {jersey}
        </div>
      )}
      <div className="absolute inset-x-[8%] text-center" style={{ top: `${safeTop + 61}%` }}>
        <p className="font-display font-bold uppercase leading-tight truncate tracking-wide" style={{ fontSize: "1.3em" }}>
          {name}
        </p>
        <p className="leading-none truncate mt-[0.2em]" style={{ fontSize: "0.72em", color: p.muted }}>
          {[position, typeLine].filter(Boolean).join(" · ")}
        </p>
        <div className="mx-auto mt-[0.5em] h-px w-1/3" style={{ background: p.accent }} />
      </div>
      {stats.length > 0 && (
        <p className="absolute inset-x-[6%] text-center leading-none" style={{ bottom: `${safeBottom + 6}%`, fontSize: "0.85em" }}>
          {stats.slice(0, 3).map((s, i) => (
            <span key={s.label}>
              {i > 0 && <span style={{ color: p.muted }}> · </span>}
              <b className="font-display" style={{ color: p.accent }}>{s.value}</b>{" "}
              <span style={{ color: p.muted, fontSize: "0.8em" }}>{s.label}</span>
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

const LAYOUT_COMPONENTS: Record<CardDesign["layout"], (props: LayoutProps) => ReactNode> = {
  classic: ClassicLayout,
  pro: ProLayout,
  sticker: StickerLayout,
  fullbleed: FullbleedLayout,
  sidebar: SidebarLayout,
  minimal: MinimalLayout,
};
