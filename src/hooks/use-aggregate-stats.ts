import { useMemo } from "react";
import type { PlayerMatchStats, CareerStats } from "@/types";

const EMPTY: CareerStats = {
  matchesPlayed: 0,
  goals: 0,
  assists: 0,
  yellowCards: 0,
  redCards: 0,
  cleanSheets: 0,
  saves: 0,
  mvpCount: 0,
};

export function useAggregateStats(allStats: PlayerMatchStats[]): CareerStats {
  return useMemo(() => {
    if (allStats.length === 0) return EMPTY;
    return allStats.reduce(
      (acc, s) => ({
        matchesPlayed: acc.matchesPlayed + (s.minutesPlayed > 0 ? 1 : 0),
        goals: acc.goals + s.goals,
        assists: acc.assists + s.assists,
        yellowCards: acc.yellowCards + s.yellowCards,
        redCards: acc.redCards + s.redCards,
        cleanSheets: acc.cleanSheets + (s.cleanSheet ? 1 : 0),
        saves: acc.saves + (s.saves ?? 0),
        mvpCount: acc.mvpCount + (s.isMVP ? 1 : 0),
      }),
      { ...EMPTY }
    );
  }, [allStats]);
}
