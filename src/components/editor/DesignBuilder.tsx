"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import {
  FINISHES,
  FRAMES,
  LAYOUTS,
  PALETTES,
  PATTERNS,
  SHAPES,
  paletteFromColors,
  resolvePalette,
  shapeClipPath,
  type FinishId,
  type FrameId,
  type LayoutId,
  type PatternId,
  type ShapeId,
} from "@/lib/cardDesign";
import { CardPreview } from "@/components/card/CardPreview";
import type { Card, CardDesign, Player } from "@/types";

interface Props {
  card: Card;
  player?: Player;
  design: CardDesign;
  locked: boolean; // custom designs need a paid tier
  locale: string;
  onChange: (patch: Partial<CardDesign>) => void;
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <div>
        <h3 className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">{title}</h3>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Option({
  active,
  label,
  title,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  title?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={title ?? label}
      className={cn(
        "flex flex-col items-center gap-1.5 rounded-lg border-2 p-2 transition-colors",
        active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
      )}
    >
      {children}
      <span className="text-[10px] leading-tight text-center">{label}</span>
    </button>
  );
}

// Mix-and-match editor: shape × frame × layout × colours × background × finish.
export function DesignBuilder({ card, player, design, locked, locale, onChange }: Props) {
  const palette = resolvePalette(design);
  const custom = design.customColors ?? { primary: "#1e3a8a", secondary: "#facc15" };
  const hasWindow = LAYOUTS[design.layout].window;

  if (locked) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-center space-y-3">
        <Lock className="h-6 w-6 text-muted-foreground mx-auto" />
        <p className="text-sm font-medium">Vlastní design je dostupný od tarifu Premium</p>
        <p className="text-xs text-muted-foreground">
          Poskládejte si kartičku z libovolného tvaru, rámu, rozložení, barev, pozadí a povrchu —
          třeba v barvách vašeho klubu.
        </p>
        <Link href={`/${locale}/settings/subscription`} className="text-sm text-primary hover:underline">
          Zobrazit tarify
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Section title="Tvar">
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(SHAPES) as ShapeId[]).map((id) => {
            const def = SHAPES[id];
            return (
              <Option key={id} active={design.shape === id} label={def.nameCs} title={def.descriptionCs} onClick={() => onChange({ shape: id })}>
                <div
                  className="w-8 h-11"
                  style={{
                    background: FRAMES[design.frame].background(palette),
                    clipPath: shapeClipPath(id),
                    borderRadius: def.radius !== undefined ? def.radius * 32 : 0,
                  }}
                />
              </Option>
            );
          })}
        </div>
      </Section>

      <Section title="Rozložení">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(Object.keys(LAYOUTS) as LayoutId[]).map((id) => (
            <Option key={id} active={design.layout === id} label={LAYOUTS[id].nameCs} title={LAYOUTS[id].descriptionCs} onClick={() => onChange({ layout: id })}>
              <CardPreview card={card} player={player} design={{ ...design, layout: id }} size="sm" flat />
            </Option>
          ))}
        </div>
      </Section>

      {hasWindow && (
        <div className="flex items-start justify-between gap-4 rounded-xl border border-border p-3">
          <div>
            <label htmlFor="pop-out" className="text-sm font-medium">
              Hráč vystupuje z rámečku
            </label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Nejlépe vypadá s fotkou bez pozadí (AI Studio → Odstranění pozadí).
            </p>
          </div>
          <Switch id="pop-out" checked={!!design.popOut} onCheckedChange={(v) => onChange({ popOut: v })} />
        </div>
      )}

      <Section title="Barvy">
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {Object.entries(PALETTES).map(([id, p]) => (
            <Option key={id} active={design.palette === id} label={p.nameCs} onClick={() => onChange({ palette: id })}>
              <div
                className="h-8 w-8 rounded-full border border-border"
                style={{ background: `conic-gradient(${p.bg1} 0 50%, ${p.accent} 50% 75%, ${p.accent2} 75%)` }}
              />
            </Option>
          ))}
          <Option
            active={design.palette === "custom"}
            label="Klubové"
            onClick={() => onChange({ palette: "custom", customColors: custom })}
          >
            <div
              className="h-8 w-8 rounded-full border border-border"
              style={{
                background: `conic-gradient(${paletteFromColors(custom.primary, custom.secondary).bg1} 0 50%, ${custom.secondary} 50%)`,
              }}
            />
          </Option>
        </div>
        {design.palette === "custom" && (
          <div className="flex flex-wrap gap-4 pt-1">
            {(["primary", "secondary"] as const).map((key) => (
              <label key={key} className="flex items-center gap-2 text-xs">
                <input
                  type="color"
                  value={custom[key]}
                  onChange={(e) => onChange({ palette: "custom", customColors: { ...custom, [key]: e.target.value } })}
                  className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent"
                />
                {key === "primary" ? "Hlavní barva klubu" : "Doplňková barva"}
              </label>
            ))}
          </div>
        )}
      </Section>

      <Section title="Pozadí">
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(PATTERNS) as PatternId[]).map((id) => (
            <Option key={id} active={design.pattern === id} label={PATTERNS[id].nameCs} title={PATTERNS[id].descriptionCs} onClick={() => onChange({ pattern: id })}>
              <div className="w-8 h-11 rounded" style={{ background: PATTERNS[id].css(palette) }} />
            </Option>
          ))}
        </div>
      </Section>

      <Section title="Rám">
        <div className="grid grid-cols-5 gap-2">
          {(Object.keys(FRAMES) as FrameId[]).map((id) => (
            <Option key={id} active={design.frame === id} label={FRAMES[id].nameCs} onClick={() => onChange({ frame: id })}>
              <div className="h-8 w-8 rounded-full border border-border" style={{ background: FRAMES[id].background(palette) }} />
            </Option>
          ))}
        </div>
      </Section>

      <Section title="Povrch" hint="Na obrazovce se odlesk hýbe, když kartičkou pohnete myší nebo prstem.">
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(FINISHES) as FinishId[]).map((id) => {
            const f = FINISHES[id];
            return (
              <Option key={id} active={design.finish === id} label={f.nameCs} onClick={() => onChange({ finish: id })}>
                <div className="relative w-8 h-11 rounded overflow-hidden text-[6px]" style={{ background: PATTERNS.clean.css(palette) }}>
                  {f.image && (
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: f.image,
                        backgroundSize: f.size,
                        backgroundPosition: "40% 40%",
                        mixBlendMode: f.blend as React.CSSProperties["mixBlendMode"],
                        opacity: f.opacity,
                      }}
                    />
                  )}
                </div>
              </Option>
            );
          })}
        </div>
      </Section>
    </div>
  );
}
