import { getLevelFromXP } from "@/lib/utils";
import { updateUserDoc } from "@/lib/firebaseServices";

// ─── XP event rewards ─────────────────────────────────────────────────────────

export const XP_EVENTS = {
  CREATE_CARD: 50,
  SHARE_CARD: 25,
  COMPLETE_MATCH_STATS: 100,
  RECEIVE_MVP: 200,
  COMPLETE_SEASON: 500,
  UNLOCK_ACHIEVEMENT_COMMON: 50,
  UNLOCK_ACHIEVEMENT_UNCOMMON: 100,
  UNLOCK_ACHIEVEMENT_RARE: 150,
  UNLOCK_ACHIEVEMENT_EPIC: 250,
  UNLOCK_ACHIEVEMENT_LEGENDARY: 500,
} as const;

export type XPEvent = keyof typeof XP_EVENTS;

// ─── Level-based unlockables ──────────────────────────────────────────────────

export interface LevelUnlock {
  level: number;
  labelCs: string;
  type: "effect" | "frame" | "template";
}

export const LEVEL_UNLOCKS: LevelUnlock[] = [
  { level: 5,  labelCs: "Stříbrný rám",        type: "frame" },
  { level: 10, labelCs: "Zlatá fólie (efekt)",  type: "effect" },
  { level: 15, labelCs: "Hologram (efekt)",      type: "effect" },
  { level: 20, labelCs: "Neon (efekt)",          type: "effect" },
  { level: 25, labelCs: "Bronzové šablony",      type: "template" },
  { level: 30, labelCs: "LED (efekt)",           type: "effect" },
  { level: 35, labelCs: "Oheň (efekt)",          type: "effect" },
  { level: 50, labelCs: "Diamantový rám",        type: "frame" },
  { level: 75, labelCs: "Vlastní pozadí",        type: "template" },
];

export function getUnlockables(level: number): LevelUnlock[] {
  return LEVEL_UNLOCKS.filter((u) => u.level <= level);
}

export function getNextUnlock(level: number): LevelUnlock | null {
  return LEVEL_UNLOCKS.find((u) => u.level > level) ?? null;
}

// ─── Add XP to user ───────────────────────────────────────────────────────────

export async function addXP(
  uid: string,
  amount: number,
  currentXP: number
): Promise<{ newXP: number; leveledUp: boolean; newLevel: number }> {
  const oldLevel = getLevelFromXP(currentXP);
  const newXP = currentXP + amount;
  const newLevel = getLevelFromXP(newXP);
  const leveledUp = newLevel > oldLevel;

  await updateUserDoc(uid, { xp: newXP, level: newLevel });

  return { newXP, leveledUp, newLevel };
}
