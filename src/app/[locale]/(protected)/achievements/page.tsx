"use client";

import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useAchievementsStore } from "@/store/appStore";
import { getAchievements, getUserAchievements } from "@/lib/firebaseServices";
import { AchievementCard } from "@/components/achievements/AchievementCard";
import { XPBar } from "@/components/achievements/XPBar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Achievement, UserAchievement } from "@/types";

type FilterTab = "all" | "unlocked" | "locked";

const CATEGORY_LABELS: Record<string, string> = {
  scoring: "Střelecké",
  defensive: "Obranné",
  playmaking: "Přihrávkové",
  milestone: "Milníky",
  social: "Sociální",
  collection: "Sběratelské",
  special: "Speciální",
};

export default function AchievementsPage() {
  const { user } = useAuthStore();
  const { achievements, unlockedIds, setAchievements, setUnlockedIds } = useAchievementsStore();
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");

  useEffect(() => {
    if (!user) return;
    Promise.all([
      achievements.length ? Promise.resolve(achievements) : getAchievements(),
      getUserAchievements(user.uid),
    ]).then(([all, userAch]) => {
      setAchievements(all);
      setUnlockedIds(userAch.map((ua) => ua.achievementId));
      setUserAchievements(userAch);
    }).finally(() => setLoading(false));
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const unlockedSet = new Set(unlockedIds);

  const filtered = achievements.filter((a) => {
    if (filter === "unlocked") return unlockedSet.has(a.id);
    if (filter === "locked") return !unlockedSet.has(a.id);
    return true;
  });

  // Group by category
  const grouped = filtered.reduce<Record<string, Achievement[]>>((acc, a) => {
    (acc[a.category] ??= []).push(a);
    return acc;
  }, {});

  const categories = Object.keys(grouped).sort();

  return (
    <div className="max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold">Úspěchy</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {unlockedIds.length} / {achievements.length} odemčeno
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          <span className="font-display font-bold text-primary">
            {unlockedIds.length}
          </span>
        </div>
      </div>

      {/* XP progress */}
      {user && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <XPBar xp={user.xp} />
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-border">
        {(["all", "unlocked", "locked"] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              filter === tab
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab === "all" ? "Vše" : tab === "unlocked" ? "Odemčené" : "Zamčené"}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-border rounded-2xl p-12 text-center space-y-2">
          <Trophy className="h-8 w-8 text-muted-foreground/40 mx-auto" />
          <p className="text-sm text-muted-foreground">Žádné úspěchy v této kategorii.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {categories.map((cat) => (
            <section key={cat}>
              <h2 className="font-display font-bold text-base mb-4 flex items-center gap-2">
                {CATEGORY_LABELS[cat] ?? cat}
                <span className="text-xs text-muted-foreground font-normal bg-muted px-2 py-0.5 rounded-full">
                  {grouped[cat].filter((a) => unlockedSet.has(a.id)).length} / {grouped[cat].length}
                </span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {grouped[cat].map((a) => {
                  const ua = userAchievements.find((u) => u.achievementId === a.id);
                  return (
                    <AchievementCard
                      key={a.id}
                      achievement={a}
                      unlocked={unlockedSet.has(a.id)}
                      unlockedAt={
                        ua
                          ? new Date(ua.unlockedAt.toDate()).toLocaleDateString("cs-CZ")
                          : undefined
                      }
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
