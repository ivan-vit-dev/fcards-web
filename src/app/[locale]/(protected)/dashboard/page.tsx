"use client";

import Link from "next/link";
import {
  CreditCard,
  Users,
  Swords,
  Sparkles,
  TrendingUp,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuthStore } from "@/store/authStore";
import { useCardsStore } from "@/store/appStore";
import { getXPToNextLevel, getLevelTier } from "@/lib/utils";
import { useParams } from "next/navigation";

const quickActions = [
  {
    href: "/cards/new",
    label: "Nová kartička",
    icon: CreditCard,
    description: "Vygeneruj kartičku ze zápasových statistik",
  },
  {
    href: "/players/new",
    label: "Nový hráč",
    icon: Users,
    description: "Přidej hráče do své sbírky",
  },
  {
    href: "/matches",
    label: "Zaznamenat zápas",
    icon: Swords,
    description: "Zapiš výsledky a statistiky zápasu",
  },
  {
    href: "/studio",
    label: "AI Studio",
    icon: Sparkles,
    description: "Přizpůsob kartičky pomocí umělé inteligence",
  },
];

const tierLabelMap: Record<string, string> = {
  bronze: "Bronzová",
  silver: "Stříbrná",
  gold: "Zlatá",
  diamond: "Diamantová",
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { cards } = useCardsStore();
  const params = useParams();
  const locale = (params?.locale as string) ?? "cs";

  const xpInfo = user ? getXPToNextLevel(user.xp) : null;
  const tier = user ? getLevelTier(user.level) : "bronze";
  const xpPercent = xpInfo ? Math.round((xpInfo.current / xpInfo.required) * 100) : 0;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Welcome + XP */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-muted-foreground text-sm">Vítejte zpět,</p>
            <h1 className="text-2xl font-display font-bold mt-0.5">
              {user?.displayName ?? "Hráči"}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Úroveň {user?.level ?? 1} · {tierLabelMap[tier]}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-display font-bold text-primary">
              {user?.xp.toLocaleString("cs-CZ") ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">celkem XP</p>
          </div>
        </div>
        {xpInfo && (
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Lv {xpInfo.level}</span>
              <span>
                {xpInfo.current} / {xpInfo.required} XP
              </span>
              <span>Lv {xpInfo.level + 1}</span>
            </div>
            <Progress value={xpPercent} className="h-2" />
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Rychlé akce
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map(({ href, label, icon: Icon, description }) => (
            <Link key={href} href={`/${locale}${href}`}>
              <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/40 hover:bg-muted/30 transition-all h-full space-y-2 cursor-pointer">
                <div className="h-9 w-9 rounded-lg gradient-brand flex items-center justify-center">
                  <Icon className="h-4 w-4 text-primary-foreground" />
                </div>
                <p className="font-medium text-sm">{label}</p>
                <p className="text-xs text-muted-foreground leading-snug">
                  {description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Nedávné kartičky
          </h2>
          <Link href={`/${locale}/cards`}>
            <Button variant="ghost" size="sm" className="text-xs h-7">
              Zobrazit vše
            </Button>
          </Link>
        </div>

        {cards.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center space-y-3">
            <CreditCard className="h-10 w-10 text-muted-foreground/40 mx-auto" />
            <p className="text-sm text-muted-foreground">
              Zatím žádné kartičky. Vytvořte svou první!
            </p>
            <Link href={`/${locale}/cards/new`}>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Vytvořit kartičku
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {cards.slice(0, 8).map((card) => (
              <Link key={card.id} href={`/${locale}/cards/${card.id}`}>
                <div className="bg-card border border-border rounded-xl aspect-[5/7] flex items-center justify-center hover:border-primary/40 transition-colors cursor-pointer overflow-hidden">
                  {card.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={card.thumbnailUrl}
                      alt="Card"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <CreditCard className="h-8 w-8 text-muted-foreground/30" />
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Kartičky celkem", value: cards.length, icon: CreditCard },
          { label: "Kartičky tento měsíc", value: user?.cardsGeneratedThisMonth ?? 0, icon: TrendingUp },
          { label: "AI kredity zbývají", value: user ? (50 - (user.aiCreditsUsedThisMonth ?? 0)) : 0, icon: Sparkles },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 text-center space-y-1">
            <Icon className="h-4 w-4 text-muted-foreground mx-auto" />
            <p className="text-xl font-display font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
