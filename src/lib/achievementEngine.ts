import type { Achievement, CareerStats } from "@/types";

export interface AchievementStats extends CareerStats {
  cardsCreated: number;
  seasonsCompleted: number;
}

const METRIC_MAP: Record<string, keyof AchievementStats> = {
  goals: "goals",
  assists: "assists",
  matches_played: "matchesPlayed",
  mvp_count: "mvpCount",
  clean_sheets: "cleanSheets",
  saves: "saves",
  cards_created: "cardsCreated",
  seasons_completed: "seasonsCompleted",
};

export function checkAchievements(
  stats: AchievementStats,
  allAchievements: Achievement[],
  alreadyUnlockedIds: string[]
): string[] {
  const alreadySet = new Set(alreadyUnlockedIds);

  return allAchievements
    .filter((a) => !alreadySet.has(a.id))
    .filter((a) => {
      const statKey = METRIC_MAP[a.triggerMetric];
      if (!statKey) return false;
      const value = stats[statKey] ?? 0;
      return value >= a.triggerThreshold;
    })
    .map((a) => a.id);
}
