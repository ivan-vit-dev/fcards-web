"use client";

import { useEffect, useRef, useState } from "react";
import { updateUserDoc } from "@/lib/firebaseServices";
import toast from "react-hot-toast";

type Permission = "default" | "granted" | "denied";

interface UseFCMResult {
  permission: Permission;
  requestPermission: () => Promise<void>;
}

// Registers service worker, gets FCM token, saves to Firestore, wires foreground handler.
// Intentionally returns nothing — callers only need permission state.
async function initFCM(uid: string): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

  try {
    const swReg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });

    const { getMessaging, getToken, onMessage } = await import("firebase/messaging");
    const { getApp } = await import("firebase/app");
    const messaging = getMessaging(getApp());

    const fcmToken = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: swReg,
    });

    if (fcmToken) {
      await updateUserDoc(uid, { fcmToken } as never);
    }

    onMessage(messaging, (payload) => {
      const { title, body } = payload.notification ?? {};
      toast(body ?? title ?? "Nová notifikace", { icon: "🔔", duration: 5000 });
    });
  } catch (err) {
    console.warn("[FCM] init failed:", err);
  }
}

export function useFCM(uid: string | null): UseFCMResult {
  const [permission, setPermission] = useState<Permission>(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission as Permission;
    }
    return "default";
  });
  const initializedRef = useRef(false);

  // Only performs Firestore + SW work — no setState — so it's safe inside useEffect
  useEffect(() => {
    if (!uid || initializedRef.current) return;
    initializedRef.current = true;
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        void initFCM(uid);
      }
    }
  }, [uid]);

  const requestPermission = async () => {
    if (!uid || typeof window === "undefined" || !("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result as Permission);
    if (result === "granted") {
      await initFCM(uid);
      toast.success("Notifikace povoleny!");
    }
  };

  return { permission, requestPermission };
}
