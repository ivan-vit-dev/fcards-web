"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { AppSidebar } from "./AppSidebar";
import { AppTopbar } from "./AppTopbar";
import { AppBottomNav } from "./AppBottomNav";
import { PageTransition } from "./PageTransition";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "cs";

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/${locale}/auth/login`);
    }
  }, [user, loading, router, locale]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Načítání...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AppTopbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          <PageTransition>
            {children}
          </PageTransition>
        </main>
      </div>
      <AppBottomNav />
    </div>
  );
}
