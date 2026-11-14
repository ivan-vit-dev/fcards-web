"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import {
  AURAS,
  FINISHES,
  FRAMES,
  LAYOUTS,
  NAME_STYLES,
  OVERLAYS,
  OVERLAY_MARGIN,
  OVERLAY_TONES,
  overlayColors,
  type OverlayToneId,
  PALETTES,
  PATTERNS,
  PHOTO_FILTERS,
  SHAPES,
  type AuraId,
  type NameStyleId,
  type PhotoFilterId,
  frameBackground,
  overlayImage,
  type OverlayId,
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
                    background: frameBackground(design.frame, palette),
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
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {(Object.keys(FRAMES) as FrameId[]).map((id) => (
            <Option key={id} active={design.frame === id} label={FRAMES[id].nameCs} onClick={() => onChange({ frame: id })}>
              {/* A frame corner big enough to show its drawn surface */}
              <div
                className="relative h-12 w-9 overflow-hidden rounded-[3px]"
                style={{ background: frameBackground(id, palette), fontSize: 9 }}
              >
                <div
                  className="absolute rounded-[1px]"
                  style={{ inset: "22% 24%", background: PATTERNS.clean.css(palette), boxShadow: "0 0 0 1px oklch(0 0 0 / 0.35)" }}
                />
                {FRAMES[id].studs && (
                  <div
                    className="absolute left-[3px] top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full"
                    style={{
                      background:
                        FRAMES[id].studs!.kind === "gem"
                          ? (FRAMES[id].studs!.color?.(palette) ?? palette.accent2)
                          : "radial-gradient(circle at 35% 30%, white, oklch(0.4 0.01 250))",
                    }}
                  />
                )}
              </div>
            </Option>
          ))}
        </div>
      </Section>

      <Section
        title="Ozdoby přes rám"
        hint="Kouř, stříkance, úlomky nebo jiskry položené přes rám, které přesahují okraj kartičky. V tisku se ořežou podle obrysu."
      >
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {(Object.keys(OVERLAYS) as OverlayId[]).map((id) => {
            const img = overlayImage(id, palette, design.shape, design.overlayTone);
            return (
              <Option
                key={id}
                active={(design.overlay ?? "none") === id}
                label={OVERLAYS[id].nameCs}
                title={OVERLAYS[id].descriptionCs}
                // A new overlay starts in its own colours; the tone row below can change them.
                onClick={() => onChange({ overlay: id, overlayTone: undefined })}
              >
                <div className="relative my-1.5 h-[56px] w-10">
                  <div
                    className="absolute inset-0 rounded-[3px]"
                    style={{ background: frameBackground(design.frame, palette) }}
                  />
                  <div className="absolute inset-[3px] rounded-[2px]" style={{ background: PATTERNS[design.pattern].css(palette) }} />
                  {img && (
                    <div
                      className="absolute"
                      style={{
                        left: `${-OVERLAY_MARGIN}%`,
                        top: `${(-OVERLAY_MARGIN / 140) * 100}%`,
                        width: `${100 + 2 * OVERLAY_MARGIN}%`,
                        height: `${((140 + 2 * OVERLAY_MARGIN) / 140) * 100}%`,
                        background: `${img} center / 100% 100% no-repeat`,
                      }}
                    />
                  )}
                </div>
              </Option>
            );
          })}
        </div>
        {design.overlay && design.overlay !== "none" && (
          <div className="space-y-1.5 pt-1">
            <p className="text-xs text-muted-foreground">Barvy ozdoby</p>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(OVERLAY_TONES) as OverlayToneId[]).map((tone) => {
                const [a, b, c] = overlayColors(tone, palette);
                const active = (design.overlayTone ?? OVERLAYS[design.overlay!].tone) === tone;
                return (
                  <button
                    key={tone}
                    type="button"
                    onClick={() => onChange({ overlayTone: tone })}
                    aria-pressed={active}
                    title={OVERLAY_TONES[tone].nameCs}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border-2 py-1 pl-1 pr-2.5 text-[11px] transition-colors",
                      active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                    )}
                  >
                    <span
                      className="h-4 w-4 rounded-full border border-border"
                      style={{ background: `conic-gradient(${a} 0 50%, ${b} 50% 75%, ${c} 75%)` }}
                    />
                    {OVERLAY_TONES[tone].nameCs}
                  </button>
                );
              })}
            </div>
          </div>
        )}
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

      <Section title="Záře kolem kartičky" hint="Světlo nebo kouř přesahující okraj — jen na obrazovce, do tisku se nedostane.">
        <ChipRow
          options={Object.entries(AURAS).map(([id, a]) => ({ id, label: a.nameCs }))}
          value={design.aura ?? "none"}
          onPick={(id) => onChange({ aura: id as AuraId })}
        />
      </Section>

      <Section title="Fotka hráče">
        <ChipRow
          options={Object.entries(PHOTO_FILTERS).map(([id, f]) => ({ id, label: f.nameCs }))}
          value={design.photoFilter ?? "none"}
          onPick={(id) => onChange({ photoFilter: id as PhotoFilterId })}
        />
      </Section>

      <Section title="Styl jména" hint="Podpis se hodí ke kartám legend, obrys k neonovým.">
        <ChipRow
          options={Object.entries(NAME_STYLES).map(([id, s]) => ({ id, label: s.nameCs }))}
          value={design.nameStyle ?? "block"}
          onPick={(id) => onChange({ nameStyle: id as NameStyleId })}
        />
      </Section>
    </div>
  );
}

function ChipRow({
  options,
  value,
  onPick,
}: {
  options: { id: string; label: string }[];
  value: string;
  onPick: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onPick(o.id)}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
            value === o.id
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
