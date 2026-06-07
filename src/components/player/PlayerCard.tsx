import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Player, PlayerPosition } from "@/types";

interface PlayerCardProps {
  player: Player;
  locale: string;
  className?: string;
}

const positionLabels: Record<PlayerPosition, string> = {
  goalkeeper: "Brankář",
  defender: "Obránce",
  midfielder: "Záložník",
  forward: "Útočník",
};

const positionColorClass: Record<PlayerPosition, string> = {
  goalkeeper: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  defender: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  midfielder: "bg-green-500/10 text-green-600 dark:text-green-400",
  forward: "bg-red-500/10 text-red-600 dark:text-red-400",
};

export function PlayerCard({ player, locale, className }: PlayerCardProps) {
  const initials = player.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Link href={`/${locale}/players/${player.id}`}>
      <div
        className={cn(
          "bg-card border border-border rounded-xl p-4 hover:border-primary/40 transition-all cursor-pointer group",
          className
        )}
      >
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-12 w-12 ring-2 ring-border group-hover:ring-primary/30 transition-all shrink-0">
            <AvatarImage src={player.photoURL} />
            <AvatarFallback className="font-display text-sm">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-display font-bold text-sm truncate">{player.displayName}</p>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span
                className={cn(
                  "text-xs px-1.5 py-0.5 rounded-md font-medium",
                  positionColorClass[player.position]
                )}
              >
                {positionLabels[player.position]}
              </span>
              {player.jerseyNumber && (
                <span className="text-xs text-muted-foreground">
                  #{player.jerseyNumber}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1 text-center">
          {[
            { label: "Zápasy", value: player.careerStats.matchesPlayed },
            { label: "Góly", value: player.careerStats.goals },
            { label: "Asistence", value: player.careerStats.assists },
          ].map(({ label, value }) => (
            <div key={label} className="bg-muted/40 rounded-lg py-1.5">
              <p className="text-sm font-display font-bold">{value}</p>
              <p className="text-[10px] text-muted-foreground leading-none mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </Link>
  );
}
