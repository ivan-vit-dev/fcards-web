"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuthStore } from "@/store/authStore";
import { getUserDoc } from "@/lib/firebaseServices";
import { useFCM } from "@/hooks/use-fcm";

function FCMInit({ uid }: { uid: string }) {
  useFCM(uid);
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getUserDoc(firebaseUser.uid);
          setUser(userDoc);
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [setUser, setLoading]);

  return (
    <>
      {user && <FCMInit uid={user.uid} />}
      {children}
    </>
  );
}
