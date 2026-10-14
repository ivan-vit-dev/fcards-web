// XP itself is computed server-side by the syncProgress Cloud Function
// (50 per card, 100 per match played, 200 per MVP, plus achievement rewards).

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
