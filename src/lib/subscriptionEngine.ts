import type { SubscriptionTier, User } from "@/types";
import type { PrintFormat } from "./printEngine";
import { FREE_MODE_AI_CREDITS, isPaidMode } from "./billing";

// ─── Tier limits (static defaults; can be overridden by Firebase Remote Config in prod) ───

export interface TierLimits {
  cardsPerMonth: number;   // -1 = unlimited
  aiCreditsPerMonth: number;
  canPrint: boolean;
  printFormats: PrintFormat[];
  premiumAIStyles: boolean;
  customBranding: boolean;
  maxPlayers: number;
  maxTeams: number;
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    cardsPerMonth: 3,
    aiCreditsPerMonth: 2,
    canPrint: false,
    printFormats: [],
    premiumAIStyles: false,
    customBranding: false,
    maxPlayers: 3,
    maxTeams: 1,
  },
  premium: {
    cardsPerMonth: 20,
    aiCreditsPerMonth: 20,
    canPrint: true,
    printFormats: ["a4-9", "a4-4"],
    premiumAIStyles: true,
    customBranding: false,
    maxPlayers: -1,
    maxTeams: 3,
  },
  team: {
    cardsPerMonth: 50,
    aiCreditsPerMonth: 50,
    canPrint: true,
    printFormats: ["a4-9", "a4-4", "sticker", "album"],
    premiumAIStyles: true,
    customBranding: true,
    maxPlayers: -1,
    maxTeams: -1,
  },
  club: {
    cardsPerMonth: -1,
    aiCreditsPerMonth: -1,
    canPrint: true,
    printFormats: ["a4-9", "a4-4", "sticker", "album"],
    premiumAIStyles: true,
    customBranding: true,
    maxPlayers: -1,
    maxTeams: -1,
  },
};

export const TIER_LABELS: Record<SubscriptionTier, string> = {
  free: "Zdarma",
  premium: "Premium",
  team: "Team",
  club: "Klub",
};

// Display prices — must match the Stripe prices (STRIPE_PRICE_* in functions/.env).
export const TIER_PRICES_CZK: Record<SubscriptionTier, number | null> = {
  free: 0,
  premium: 149,
  team: 399,
  club: null, // contact sales
};

// Yearly = 10 × monthly (two months free).
export const TIER_PRICES_YEARLY_CZK: Record<SubscriptionTier, number | null> = {
  free: 0,
  premium: 1490,
  team: 3990,
  club: null,
};

// ─── Gate functions ───────────────────────────────────────────────────────────

/** Tier whose limits apply. In free billing mode everyone gets everything ("club"). */
export function effectiveTier(user: User | null): SubscriptionTier {
  if (!isPaidMode()) return "club";
  return user?.subscriptionTier ?? "free";
}

/** Monthly AI credits (-1 = unlimited). Free mode keeps a safety cap: AI jobs cost real money. */
export function aiCreditLimit(tier: SubscriptionTier): number {
  return isPaidMode() ? TIER_LIMITS[tier].aiCreditsPerMonth : FREE_MODE_AI_CREDITS;
}

export function getLimits(tier: SubscriptionTier): TierLimits {
  return TIER_LIMITS[tier];
}

export function canGenerateCard(
  tier: SubscriptionTier,
  cardsGeneratedThisMonth: number
): boolean {
  const limits = TIER_LIMITS[tier];
  if (limits.cardsPerMonth === -1) return true;
  return cardsGeneratedThisMonth < limits.cardsPerMonth;
}

export function canUseAI(
  tier: SubscriptionTier,
  aiCreditsUsedThisMonth: number
): boolean {
  const limit = aiCreditLimit(tier);
  if (limit === -1) return true;
  return aiCreditsUsedThisMonth < limit;
}

export const currentMonth = () => new Date().toISOString().slice(0, 7);

// Stored counters only count for the month they were written in; a new month starts at 0.
export function getAICreditsUsed(user: User | null): number {
  if (!user || user.aiCreditsMonth !== currentMonth()) return 0;
  return user.aiCreditsUsedThisMonth ?? 0;
}

export function getCardsGenerated(user: User | null): number {
  if (!user || user.cardsMonth !== currentMonth()) return 0;
  return user.cardsGeneratedThisMonth ?? 0;
}

// Tiers in ascending order of what they unlock.
const TIER_RANK: Record<SubscriptionTier, number> = { free: 0, premium: 1, team: 2, club: 3 };

export function tierAtLeast(tier: SubscriptionTier, required: SubscriptionTier): boolean {
  return TIER_RANK[tier] >= TIER_RANK[required];
}

// Returns null for unlimited.
export function getAICreditsLeft(user: User | null): number | null {
  const limit = aiCreditLimit(effectiveTier(user));
  if (limit === -1) return null;
  return Math.max(0, limit - getAICreditsUsed(user));
}

export function canUsePremiumAIStyle(tier: SubscriptionTier): boolean {
  return TIER_LIMITS[tier].premiumAIStyles;
}

export function canPrint(tier: SubscriptionTier): boolean {
  return TIER_LIMITS[tier].canPrint;
}

export function canUsePrintFormat(tier: SubscriptionTier, format: PrintFormat): boolean {
  return TIER_LIMITS[tier].printFormats.includes(format);
}

export function canAddPlayer(tier: SubscriptionTier, currentPlayerCount: number): boolean {
  const max = TIER_LIMITS[tier].maxPlayers;
  if (max === -1) return true;
  return currentPlayerCount < max;
}

export function canAddTeam(tier: SubscriptionTier, currentTeamCount: number): boolean {
  const max = TIER_LIMITS[tier].maxTeams;
  if (max === -1) return true;
  return currentTeamCount < max;
}

export function getUpgradeReason(
  tier: SubscriptionTier,
  action: "generate" | "ai" | "print" | "premiumStyle" | "premiumFeature" | "player" | "team"
): string {
  if (!isPaidMode()) {
    return action === "ai"
      ? `Tento měsíc jste využili všech ${FREE_MODE_AI_CREDITS} AI úprav. Nové budou k dispozici 1. dne příštího měsíce.`
      : "Tato funkce teď není dostupná.";
  }
  const reasons: Record<string, string> = {
    generate: `Bezplatný plán umožňuje max. ${TIER_LIMITS.free.cardsPerMonth} kartičky měsíčně.`,
    ai: `Bezplatný plán umožňuje max. ${TIER_LIMITS.free.aiCreditsPerMonth} AI kredity měsíčně.`,
    print: "Tisk karet je dostupný od tarifu Premium.",
    premiumStyle: "Prémiové AI styly jsou dostupné od tarifu Premium.",
    premiumFeature: "Tato AI funkce je dostupná od tarifu Premium.",
    player: `Bezplatný plán umožňuje max. ${TIER_LIMITS.free.maxPlayers} hráče.`,
    team: `Bezplatný plán umožňuje max. ${TIER_LIMITS.free.maxTeams} tým.`,
  };
  return reasons[action] ?? "Upgradujte svůj plán pro přístup k této funkci.";
}

// Returns the minimum tier that unlocks the given action
export function requiredTierFor(
  action: "generate" | "ai" | "print" | "premiumStyle"
): SubscriptionTier {
  const map: Record<string, SubscriptionTier> = {
    generate: "free",
    ai: "free",
    print: "premium",
    premiumStyle: "premium",
  };
  return map[action] ?? "premium";
}
