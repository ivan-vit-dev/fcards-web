"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "cs";

  useEffect(() => {
    if (!loading && user) {
      router.replace(`/${locale}/dashboard`);
    }
  }, [user, loading, router, locale]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (user) return null;

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-2">
        <div className="text-center mb-6">
          <span className="font-display text-2xl font-bold gradient-text">
            Fotbalové Kartičky
          </span>
        </div>
        {children}
      </div>
    </main>
  );
}
