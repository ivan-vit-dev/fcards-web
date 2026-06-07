import { cn, getRarityColor } from "@/lib/utils";
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

export function CardPreview({
  card,
  player,
  size = "md",
  className,
  onClick,
}: CardPreviewProps) {
  const rarityColor = getRarityColor(card.rarity);
  const isMythic = card.rarity === "mythic";
  const isLegendary = card.rarity === "legendary";

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative rounded-xl overflow-hidden flex-shrink-0 select-none",
        sizeClasses[size],
        onClick && "cursor-pointer",
        isMythic && "gradient-mythic",
        className
      )}
      style={
        !isMythic
          ? {
              background: `linear-gradient(160deg, var(--card) 60%, color-mix(in oklch, ${rarityColor} 12%, var(--card)))`,
              boxShadow: isLegendary
                ? `var(--shadow-card-legendary)`
                : `0 2px 12px color-mix(in oklch, ${rarityColor} 20%, transparent)`,
            }
          : undefined
      }
    >
      {/* Border overlay */}
      <div
        className="absolute inset-0 rounded-xl border-2 pointer-events-none z-10"
        style={{ borderColor: `color-mix(in oklch, ${rarityColor} 40%, transparent)` }}
      />

      {/* Card image or placeholder */}
      <div className="absolute inset-0">
        {card.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.imageUrl}
            alt="Card"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col">
            {/* Photo area */}
            <div className="flex-1 relative overflow-hidden">
              {player?.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={player.photoURL}
                  alt={player.displayName}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{
                    background: `linear-gradient(180deg, color-mix(in oklch, ${rarityColor} 20%, transparent), color-mix(in oklch, ${rarityColor} 5%, transparent))`,
                  }}
                >
                  <div
                    className="rounded-full opacity-30"
                    style={{
                      width: "45%",
                      height: "45%",
                      background: rarityColor,
                    }}
                  />
                </div>
              )}
              {/* Gradient overlay bottom of photo */}
              <div
                className="absolute bottom-0 left-0 right-0 h-1/3"
                style={{
                  background: `linear-gradient(to top, var(--card), transparent)`,
                }}
              />
            </div>

            {/* Info area */}
            <div className="px-[8%] pb-[6%] pt-[3%] space-y-[4%]">
              {/* Player name */}
              <div>
                <p
                  className="font-display font-bold leading-tight truncate"
                  style={{ fontSize: "1.3em", color: rarityColor }}
                >
                  {player?.displayName ?? "Hráč"}
                </p>
                <p className="text-muted-foreground leading-none" style={{ fontSize: "0.85em" }}>
                  {cardTypeLabels[card.cardType] ?? card.cardType}
                  {card.season ? ` · ${card.season}` : ""}
                </p>
              </div>

              {/* Stats row */}
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
                        style={{
                          background: `color-mix(in oklch, ${rarityColor} 12%, transparent)`,
                          padding: "3% 0",
                        }}
                      >
                        <p className="font-display font-bold leading-none" style={{ fontSize: "1.2em" }}>
                          {value}
                        </p>
                        <p className="text-muted-foreground leading-none" style={{ fontSize: "0.7em" }}>
                          {label}
                        </p>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Rarity badge — top left */}
      <div className="absolute top-[4%] left-[4%] z-20">
        <RarityBadge rarity={card.rarity} className="text-[0.75em] px-1.5 py-0" />
      </div>

      {/* Jersey number — top right */}
      {player?.jerseyNumber && (
        <div
          className="absolute top-[4%] right-[4%] z-20 font-display font-bold leading-none opacity-60"
          style={{ fontSize: "1.4em", color: rarityColor }}
        >
          #{player.jerseyNumber}
        </div>
      )}

      {/* AI pending overlay */}
      {card.aiStatus === "pending" || card.aiStatus === "processing" ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-xl">
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
  );
}
