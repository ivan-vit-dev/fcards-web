"use client";

import { useState, useRef, useCallback } from "react";
import { httpsCallable } from "firebase/functions";
import { onSnapshot, doc } from "firebase/firestore";
import { functions, db } from "@/lib/firebase";
import type { AIStatus } from "@/types";
import toast from "react-hot-toast";

const GENERATION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export interface AIGenerationState {
  status: AIStatus;
  imageUrl: string | null;
  story: string | null;
  isRunning: boolean;
}

export function useAIGeneration() {
  const [state, setState] = useState<AIGenerationState>({
    status: "pending",
    imageUrl: null,
    story: null,
    isRunning: false,
  });

  const unsubRef = useRef<(() => void) | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    unsubRef.current?.();
    unsubRef.current = null;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const pollCard = useCallback((cardId: string) => {
    const unsub = onSnapshot(doc(db, "cards", cardId), (snap) => {
      const data = snap.data();
      if (!data) return;
      const aiStatus = data.aiStatus as AIStatus;

      setState((s) => ({
        ...s,
        status: aiStatus,
        imageUrl: data.imageUrl ?? s.imageUrl,
        story: data.aiStory ?? s.story,
      }));

      if (aiStatus === "done") {
        cleanup();
        setState((s) => ({ ...s, isRunning: false }));
      } else if (aiStatus === "error") {
        cleanup();
        setState((s) => ({ ...s, isRunning: false }));
        toast.error("Generování selhalo. Zkuste to znovu.");
      }
    });

    unsubRef.current = unsub;

    timeoutRef.current = setTimeout(() => {
      cleanup();
      setState((s) => ({ ...s, status: "error", isRunning: false }));
      toast.error("Časový limit vypršel. Zkuste to znovu.");
    }, GENERATION_TIMEOUT_MS);
  }, [cleanup]);

  const callFunction = useCallback(async (
    functionName: string,
    args: Record<string, unknown>,
    cardId?: string
  ): Promise<Record<string, unknown>> => {
    cleanup();
    setState({ status: "pending", imageUrl: null, story: null, isRunning: true });

    try {
      const fn = httpsCallable<Record<string, unknown>, Record<string, unknown>>(
        functions,
        functionName
      );
      const result = await fn(args);

      if (cardId) {
        pollCard(cardId);
      } else {
        setState((s) => ({ ...s, isRunning: false, status: "done" }));
      }

      return result.data;
    } catch (err) {
      cleanup();
      setState((s) => ({ ...s, status: "error", isRunning: false }));
      toast.error("Chyba při volání AI funkce.");
      throw err;
    }
  }, [cleanup, pollCard]);

  return { ...state, callFunction, cleanup };
}
