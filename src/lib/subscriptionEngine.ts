import type { SubscriptionTier } from "@/types";
import type { PrintFormat } from "./printEngine";

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

export const TIER_PRICES_CZK: Record<SubscriptionTier, number | null> = {
  free: 0,
  premium: 149,
  team: 399,
  club: null, // contact sales
};

// ─── Gate functions ───────────────────────────────────────────────────────────

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
  const limits = TIER_LIMITS[tier];
  if (limits.aiCreditsPerMonth === -1) return true;
  return aiCreditsUsedThisMonth < limits.aiCreditsPerMonth;
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
  action: "generate" | "ai" | "print" | "premiumStyle" | "player" | "team"
): string {
  const reasons: Record<string, string> = {
    generate: `Bezplatný plán umožňuje max. ${TIER_LIMITS.free.cardsPerMonth} kartičky měsíčně.`,
    ai: `Bezplatný plán umožňuje max. ${TIER_LIMITS.free.aiCreditsPerMonth} AI kredity měsíčně.`,
    print: "Tisk karet je dostupný od tarifu Premium.",
    premiumStyle: "Prémiové AI styly jsou dostupné od tarifu Premium.",
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
