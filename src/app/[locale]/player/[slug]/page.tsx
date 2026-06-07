"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Target,
  Handshake,
  Star,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { CardPreview } from "@/components/card/CardPreview";
import { RarityBadge } from "@/components/card/RarityBadge";
import { getPublicPlayerBySlug, getCards, getAchievements, getUserAchievements, getUserDoc } from "@/lib/firebaseServices";
import { getLevelTier } from "@/lib/utils";
import { LevelBadge } from "@/components/achievements/LevelBadge";
import type { Player, PlayerPosition, Card, Achievement } from "@/types";

const positionLabels: Record<PlayerPosition, string> = {
  goalkeeper: "Brankář",
  defender: "Obránce",
  midfielder: "Záložník",
  forward: "Útočník",
};

const positionColorClass: Record<PlayerPosition, string> = {
  goalkeeper: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  defender: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  midfielder: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  forward: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
};

export default function PublicPlayerPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const locale = (params?.locale as string) ?? "cs";

  const [player, setPlayer] = useState<Player | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
  const [userLevel, setUserLevel] = useState(1);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    getPublicPlayerBySlug(slug)
      .then(async (p) => {
        if (!p) {
          setNotFound(true);
          return;
        }
        setPlayer(p);

        // Load public cards, achievements, and user level in parallel
        const [allCards, allAchievements, userAchievements, userDoc] = await Promise.all([
          getCards(p.userId).catch(() => [] as Card[]),
          getAchievements().catch(() => [] as Achievement[]),
          getUserAchievements(p.userId).catch(() => []),
          getUserDoc(p.userId).catch(() => null),
        ]);
        setCards(allCards.filter((c) => c.playerId === p.id && c.isPublic));
        if (userDoc) setUserLevel(userDoc.level);
        const unlockedIds = new Set(userAchievements.map((ua) => ua.achievementId));
        setUnlockedAchievements(allAchievements.filter((a) => unlockedIds.has(a.id)));
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const initials =
    player?.displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "?";

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <main className="max-w-3xl mx-auto px-4 py-10">
        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {!loading && notFound && (
          <div className="text-center py-20 space-y-3">
            <AlertCircle className="h-10 w-10 text-muted-foreground/40 mx-auto" />
            <p className="text-lg font-display font-bold">Hráč nenalezen</p>
            <p className="text-sm text-muted-foreground">
              Tento profil neexistuje nebo není veřejný.
            </p>
            <Link href={`/${locale}`} className="text-sm text-primary hover:underline">
              Zpět na hlavní stránku
            </Link>
          </div>
        )}

        {!loading && player && (
          <div className="space-y-8">
            {/* Hero */}
            <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <Avatar className="h-24 w-24 ring-4 ring-primary/20 shrink-0">
                  <AvatarImage src={player.photoURL} />
                  <AvatarFallback className="text-2xl font-display">{initials}</AvatarFallback>
                </Avatar>
                <div className="text-center sm:text-left space-y-2 flex-1">
                  <h1 className="text-3xl font-display font-bold">{player.displayName}</h1>
                  <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                    <Badge variant="outline" className={positionColorClass[player.position]}>
                      {positionLabels[player.position]}
                    </Badge>
                    {player.jerseyNumber && (
                      <Badge variant="outline" className="font-display">
                        #{player.jerseyNumber}
                      </Badge>
                    )}
                    <LevelBadge level={userLevel} tier={getLevelTier(userLevel)} size="sm" />
                  </div>
                </div>
              </div>
            </div>

            {/* Career stats */}
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                Kariérní statistiky
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Zápasy", value: player.careerStats.matchesPlayed, icon: Shield },
                  { label: "Góly", value: player.careerStats.goals, icon: Target },
                  { label: "Asistence", value: player.careerStats.assists, icon: Handshake },
                  { label: "MVP", value: player.careerStats.mvpCount, icon: Star },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="bg-card border border-border rounded-xl p-4 text-center">
                    <Icon className="h-5 w-5 text-muted-foreground mx-auto mb-1.5" />
                    <p className="text-2xl font-display font-bold">{value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* GK-specific */}
            {player.position === "goalkeeper" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-card border border-border rounded-xl p-4 text-center">
                  <p className="text-2xl font-display font-bold">{player.careerStats.cleanSheets}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Čistá konta</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4 text-center">
                  <p className="text-2xl font-display font-bold">{player.careerStats.saves}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Zákroky</p>
                </div>
              </div>
            )}

            {/* Achievement badges */}
            {unlockedAchievements.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                  Úspěchy ({unlockedAchievements.length})
                </h2>
                <div className="flex flex-wrap gap-2">
                  {unlockedAchievements.map((a) => (
                    <div
                      key={a.id}
                      title={a.descriptionCs}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-card border border-border rounded-full text-xs font-medium"
                    >
                      <span className="text-primary">✦</span>
                      {a.nameCs}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Public card grid */}
            {cards.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                  Kartičky ({cards.length})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {cards.map((card) => (
                    <Link
                      key={card.id}
                      href={`/${locale}/card/${card.shareSlug}`}
                      className="group relative"
                    >
                      <div className="rounded-xl overflow-hidden transition-transform duration-200 group-hover:scale-[1.02]">
                        <CardPreview card={card} size="sm" />
                      </div>
                      <div className="mt-1.5 flex items-center justify-between px-0.5">
                        <RarityBadge rarity={card.rarity} />
                        {card.season && (
                          <span className="text-[10px] text-muted-foreground">{card.season}</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Branding footer */}
            <div className="text-center pt-4">
              <p className="text-xs text-muted-foreground">
                Vytvořeno pomocí{" "}
                <Link href={`/${locale}`} className="text-primary hover:underline font-medium">
                  Fotbalové Kartičky
                </Link>
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
