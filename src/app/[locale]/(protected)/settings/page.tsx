"use client";

import { useAuthStore } from "@/store/authStore";
import { useRouter, useParams } from "next/navigation";
import { CreditCard, Building2, Shield, ChevronRight } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "cs";

  if (!user) return null;

  const items = [
    {
      icon: CreditCard,
      title: "Předplatné",
      description: "Správa plánu, limitů a funkcí",
      href: `/${locale}/settings/subscription`,
      show: true,
    },
    {
      icon: Building2,
      title: "Klub",
      description: "Správa klubu, týmů a brandingu",
      href: `/${locale}/settings/club`,
      show: user.role === "clubAdmin" || user.role === "superAdmin",
    },
    {
      icon: Shield,
      title: "Administrace",
      description: "Správa uživatelů, šablon a platformy",
      href: `/${locale}/admin`,
      show: user.role === "superAdmin",
    },
  ].filter((i) => i.show);

  return (
    <div className="p-6 max-w-xl space-y-6">
      <div>
        <h1 className="text-xl font-bold">Nastavení</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Správa účtu a platformy
        </p>
      </div>

      <div className="space-y-2">
        {items.map(({ icon: Icon, title, description, href }) => (
          <button
            key={href}
            onClick={() => router.push(href)}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-accent transition-colors text-left group"
          >
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{title}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
