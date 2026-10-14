import { cn, getRarityColor } from "@/lib/utils";
import { resolveTemplateStyle } from "@/lib/cardTemplates";
import { RarityBadge } from "./RarityBadge";
import type { Card, Player, Template } from "@/types";

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

interface CardPreviewProps {
  card: Card;
  player?: Player;
  template?: Template;
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
}

const sizeClasses = {
  sm: "w-[120px] h-[168px] text-[8px]",
  md: "w-[210px] h-[294px] text-[11px]",
  lg: "w-[280px] h-[392px] text-[13px]",
};

// The template drives frame, face and typography; rarity drives badge, inner border and glow.
export function CardPreview({
  card,
  player,
  template,
  size = "md",
  className,
  onClick,
}: CardPreviewProps) {
  const rarityColor = getRarityColor(card.rarity);
  const isMythic = card.rarity === "mythic";
  const isLegendary = card.rarity === "legendary";
  const style = resolveTemplateStyle({
    category: template?.category,
    templateStyle: card.templateStyle,
    templateId: card.templateId,
  });
  const name = player?.displayName ?? card.playerName ?? "Hráč";
  const photo = card.photoUrl ?? player?.photoURL;

  return (
    <div
      onClick={onClick}
      className={cn(
        // em, not %: percentage padding resolves against the parent's width, not the card's.
        "relative rounded-xl p-[0.5em] flex-shrink-0 select-none",
        sizeClasses[size],
        onClick && "cursor-pointer",
        isMythic && "gradient-mythic",
        className
      )}
      style={{
        ...(!isMythic && { background: style.frame }),
        boxShadow: isLegendary
          ? "var(--shadow-card-legendary)"
          : `0 2px 12px color-mix(in oklch, ${rarityColor} 25%, transparent)`,
      }}
    >
      <div
        className="relative h-full w-full rounded-[0.55rem] overflow-hidden"
        style={{ background: style.body, color: style.text }}
      >
        {/* Rarity inner border */}
        <div
          className="absolute inset-0 rounded-[0.55rem] border-2 pointer-events-none z-10"
          style={{ borderColor: `color-mix(in oklch, ${rarityColor} 55%, transparent)` }}
        />

        <div className="absolute inset-0 flex flex-col">
            {/* Photo area */}
            <div className="flex-1 relative overflow-hidden">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo}
                  alt={name}
                  crossOrigin="anonymous"
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div
                    className="rounded-full opacity-30"
                    style={{ width: "45%", height: "45%", background: rarityColor }}
                  />
                </div>
              )}
              {!style.infoBg && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-1/3"
                  style={{ background: "linear-gradient(to top, oklch(0 0 0 / 0.45), transparent)" }}
                />
              )}
            </div>

            {/* Info area */}
            <div
              className="px-[8%] pb-[6%] pt-[4%] space-y-[4%]"
              style={style.infoBg ? { background: style.infoBg } : undefined}
            >
              <div>
                <p
                  className="font-display font-bold leading-tight truncate"
                  style={{ fontSize: "1.3em", color: style.name, textShadow: style.nameShadow }}
                >
                  {name}
                </p>
                <p className="leading-none" style={{ fontSize: "0.85em", color: style.muted }}>
                  {cardTypeLabels[card.cardType] ?? card.cardType}
                  {card.season ? ` · ${card.season}` : ""}
                </p>
              </div>

              {card.cardStats && (
                <div className="grid grid-cols-3 gap-[3%]">
                  {[
                    { label: "GOL", value: card.cardStats.goals },
                    { label: "ASS", value: card.cardStats.assists },
                    { label: "HOD", value: card.cardStats.rating },
                  ]
                    .filter((s) => s.value !== undefined)
                    .map(({ label, value }) => (
                      <div
                        key={label}
                        className="text-center rounded"
                        style={{ background: style.statBg, padding: "3% 0" }}
                      >
                        <p
                          className="font-display font-bold leading-none"
                          style={{ fontSize: "1.2em", color: style.infoBg ? style.name : style.text }}
                        >
                          {value}
                        </p>
                        <p className="leading-none" style={{ fontSize: "0.7em", color: style.muted }}>
                          {label}
                        </p>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

        {style.sheen && (
          <div className="absolute inset-0 pointer-events-none" style={{ background: style.sheen }} />
        )}

        {/* Rarity badge — top left */}
        <div className="absolute top-[4%] left-[4%] z-20">
          <RarityBadge rarity={card.rarity} className="text-[0.75em] px-1.5 py-0" />
        </div>

        {/* Jersey number — top right */}
        {player?.jerseyNumber && (
          <div
            className="absolute top-[4%] right-[5%] z-20 font-display font-bold leading-none"
            style={{
              fontSize: "1.4em",
              color: style.jersey ?? style.name,
              textShadow: style.jersey ? undefined : "0 1px 2px oklch(0 0 0 / 0.4)",
            }}
          >
            #{player.jerseyNumber}
          </div>
        )}

        {card.aiStatus === "pending" || card.aiStatus === "processing" ? (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <div className="text-center space-y-1">
              <div
                className="h-6 w-6 rounded-full border-2 border-t-transparent animate-spin mx-auto"
                style={{ borderColor: rarityColor }}
              />
              <p className="text-[0.8em] text-muted-foreground">Generuji…</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
