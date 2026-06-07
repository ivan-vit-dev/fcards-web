import Link from "next/link";
import { UsersRound, Calendar, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Team } from "@/types";

interface TeamCardProps {
  team: Team;
  locale: string;
  playerCount?: number;
  className?: string;
}

export function TeamCard({ team, locale, playerCount = 0, className }: TeamCardProps) {
  return (
    <Link href={`/${locale}/teams/${team.id}`}>
      <div
        className={cn(
          "bg-card border border-border rounded-xl p-4 hover:border-primary/40 transition-all cursor-pointer group",
          className
        )}
      >
        <div className="flex items-start gap-3 mb-3">
          {team.logoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={team.logoURL}
              alt={team.name}
              className="h-10 w-10 rounded-lg object-cover shrink-0"
            />
          ) : (
            <div className="h-10 w-10 rounded-lg gradient-brand flex items-center justify-center shrink-0">
              <UsersRound className="h-5 w-5 text-primary-foreground" />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-display font-bold text-sm truncate group-hover:text-primary transition-colors">
              {team.name}
            </p>
            {team.ageGroup && (
              <p className="text-xs text-muted-foreground mt-0.5">{team.ageGroup}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5 text-center">
          <div className="bg-muted/40 rounded-lg py-1.5 px-2">
            <div className="flex items-center justify-center gap-1">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <p className="text-xs font-medium truncate">{team.season}</p>
            </div>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Sezóna</p>
          </div>
          <div className="bg-muted/40 rounded-lg py-1.5 px-2">
            <div className="flex items-center justify-center gap-1">
              <Shield className="h-3 w-3 text-muted-foreground" />
              <p className="text-xs font-medium">{playerCount}</p>
            </div>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Hráči</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
