import { canGenerateCard as _canGenerateCard } from "./subscriptionEngine";
import type {
  Player,
  PlayerMatchStats,
  CardType,
  CardStats,
  Rarity,
  User,
} from "@/types";

export function canGenerateCard(user: User): boolean {
  return _canGenerateCard(user.subscriptionTier, user.cardsGeneratedThisMonth ?? 0);
}

// ─── Share slug ───────────────────────────────────────────────────────────────

export function generateShareSlug(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 8 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

// ─── Rarity computation ───────────────────────────────────────────────────────

export function computeDefaultRarity(
  cardType: CardType,
  stats?: PlayerMatchStats | null,
  _player?: Player | null
): Rarity {
  // Special card types get fixed minimum rarities
  if (cardType === "mvp") return stats?.isMVP ? "rare" : "uncommon";
  if (cardType === "champion" || cardType === "tournament") return "epic";
  if (cardType === "birthday") return "uncommon";
  if (cardType === "farewell") return "rare";
  if (cardType === "rookie") return "uncommon";
  if (cardType === "achievement") return "rare";

  // For match and season cards, use stats
  if (!stats) return "common";

  const { goals = 0, rating = 5, isMVP } = stats;

  if (isMVP && goals >= 3) return "legendary";
  if (isMVP) return "epic";
  if (goals >= 3) return "epic";
  if (rating >= 9) return "rare";
  if (goals >= 1 || rating >= 7.5) return "uncommon";
  return "common";
}

// ─── Card stats builder ───────────────────────────────────────────────────────

export function buildCardStats(
  cardType: CardType,
  player: Player,
  matchStats?: PlayerMatchStats | null
): CardStats {
  const career = player.careerStats;

  if (cardType === "season") {
    return {
      goals: career.goals,
      assists: career.assists,
      cleanSheets: career.cleanSheets,
      saves: career.saves,
      rating: career.matchesPlayed > 0
        ? Math.round((career.goals / career.matchesPlayed) * 10 + 5)
        : 5,
      overall: computeOverall(player, career.goals, career.assists, career.matchesPlayed),
    };
  }

  if (matchStats) {
    return {
      goals: matchStats.goals,
      assists: matchStats.assists,
      cleanSheets: matchStats.cleanSheet ? 1 : 0,
      saves: matchStats.saves,
      rating: matchStats.rating,
      overall: Math.round(matchStats.rating * 10),
    };
  }

  // Default: career-based
  return {
    goals: career.goals,
    assists: career.assists,
    overall: computeOverall(player, career.goals, career.assists, career.matchesPlayed),
  };
}

function computeOverall(
  player: Player,
  goals: number,
  assists: number,
  matchesPlayed: number
): number {
  if (matchesPlayed === 0) return 50;
  const goalsPerMatch = goals / matchesPlayed;
  const assistsPerMatch = assists / matchesPlayed;
  const base =
    player.position === "goalkeeper"
      ? 50 + Math.min(player.careerStats.cleanSheets * 2, 30)
      : 50 + Math.min(goalsPerMatch * 20 + assistsPerMatch * 10, 45);
  return Math.min(Math.round(base), 99);
}

// ─── Default card type for player position ────────────────────────────────────

export function defaultCardTypeForPosition(_player: Player): CardType {
  return "match";
}

// ─── Rarity display helpers ───────────────────────────────────────────────────

export const RARITY_ORDER: Rarity[] = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
  "mythic",
  "limited",
];

export const CARD_TYPES: CardType[] = [
  "match",
  "mvp",
  "season",
  "achievement",
  "team",
  "tournament",
  "birthday",
  "farewell",
  "champion",
  "rookie",
];

export const CARD_TYPE_LABELS: Record<CardType, string> = {
  match: "Zápasová kartička",
  mvp: "MVP kartička",
  season: "Sezónní kartička",
  achievement: "Úspěchová kartička",
  team: "Týmová kartička",
  tournament: "Turnajová kartička",
  birthday: "Narozeninová kartička",
  farewell: "Rozlučková kartička",
  champion: "Šampionská kartička",
  rookie: "Nováčkovská kartička",
};

export const CARD_TYPE_DESCRIPTIONS: Record<CardType, string> = {
  match: "Zaznamenej výkon z konkrétního zápasu",
  mvp: "Speciální kartička pro nejlepšího hráče zápasu",
  season: "Shrnutí celé sezóny s kariérními statistikami",
  achievement: "Oslava splněného úspěchu",
  team: "Kartička reprezentující celý tým",
  tournament: "Vzpomínka na turnajové vystoupení",
  birthday: "Narozeninová kartička k výročí",
  farewell: "Rozlučková kartička při odchodu",
  champion: "Šampionská kartička pro vítěze",
  rookie: "Prvotní kartička nového hráče",
};
