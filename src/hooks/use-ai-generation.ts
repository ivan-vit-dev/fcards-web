"use client";

import { useState, useCallback } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import type { AIStatus } from "@/types";
import toast from "react-hot-toast";

const CALL_ERROR_MESSAGES: Record<string, string> = {
  "functions/resource-exhausted": "Vyčerpali jste AI kredity na tento měsíc.",
  "functions/failed-precondition": "Tato AI funkce je dostupná od tarifu Premium.",
  "functions/not-found": "Kartička nenalezena.",
  "functions/unauthenticated": "Pro použití AI se přihlaste.",
};

export interface AIGenerationState {
  status: AIStatus;
  imageUrl: string | null;
  story: string | null;
  isRunning: boolean;
}

interface AIResult {
  imageUrl?: string;
  story?: string;
}

// AI callables finish the job before responding (and also write the result to the card),
// so the response itself carries the result — no Firestore listener needed.
export function useAIGeneration() {
  const [state, setState] = useState<AIGenerationState>({
    status: "pending",
    imageUrl: null,
    story: null,
    isRunning: false,
  });

  const callFunction = useCallback(
    async (functionName: string, args: Record<string, unknown>): Promise<AIResult> => {
      setState({ status: "processing", imageUrl: null, story: null, isRunning: true });
      try {
        const fn = httpsCallable<Record<string, unknown>, AIResult>(functions, functionName, {
          timeout: 5 * 60 * 1000,
        });
        const { data } = await fn(args);
        setState({
          status: "done",
          imageUrl: data.imageUrl ?? null,
          story: data.story ?? null,
          isRunning: false,
        });
        return data;
      } catch (err) {
        setState((s) => ({ ...s, status: "error", isRunning: false }));
        const code = (err as { code?: string }).code ?? "";
        toast.error(CALL_ERROR_MESSAGES[code] ?? "Generování selhalo. Zkuste to znovu.");
        throw err;
      }
    },
    []
  );

  return { ...state, callFunction };
}
