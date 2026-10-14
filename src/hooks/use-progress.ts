"use client";

import { useCallback } from "react";
import { httpsCallable } from "firebase/functions";
import toast from "react-hot-toast";
import { functions } from "@/lib/firebase";
import { useAuthStore } from "@/store/authStore";

interface ProgressResult {
  xp: number;
  level: number;
  leveledUp: boolean;
  newAchievements: { id: string; nameCs: string; xpReward: number }[];
}

// XP and achievements are computed server-side (syncProgress). Call this after anything that
// can change them; it updates the stored user and celebrates new unlocks.
export function useSyncProgress() {
  const setUser = useAuthStore((s) => s.setUser);

  return useCallback(async (): Promise<ProgressResult | null> => {
    try {
      const { data } = await httpsCallable<void, ProgressResult>(functions, "syncProgress")();
      const current = useAuthStore.getState().user;
      if (current) setUser({ ...current, xp: data.xp, level: data.level });

      for (const a of data.newAchievements) {
        toast.success(`Nový úspěch: ${a.nameCs} (+${a.xpReward} XP)`, {
          icon: "🏆",
          duration: 5000,
        });
      }
      if (data.leveledUp) {
        toast.success(`Postup na úroveň ${data.level}!`, { icon: "⭐", duration: 5000 });
      }
      return data;
    } catch (err) {
      // Progress is a bonus — never block the action that triggered it.
      console.warn("[syncProgress]", err);
      return null;
    }
  }, [setUser]);
}
