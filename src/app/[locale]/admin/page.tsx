"use client";

import { useEffect, useState } from "react";
import { getAdminStats } from "@/lib/firebaseServices";
import { Users, CreditCard, Building2, Layers } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Stats {
  users: number;
  cards: number;
  clubs: number;
  templates: number;
}

const statConfig = [
  { key: "users" as const, label: "Uživatelé", icon: Users, color: "text-blue-400" },
  { key: "cards" as const, label: "Kartičky", icon: CreditCard, color: "text-amber-400" },
  { key: "clubs" as const, label: "Kluby", icon: Building2, color: "text-green-400" },
  { key: "templates" as const, label: "Šablony", icon: Layers, color: "text-purple-400" },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold">Admin přehled</h1>
        <p className="text-sm text-muted-foreground">
          Celkové statistiky platformy
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statConfig.map(({ key, label, icon: Icon, color }) => (
          <div
            key={key}
            className="rounded-xl border border-border bg-card p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {label}
              </p>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold font-display">
                {(stats?.[key] ?? 0).toLocaleString("cs")}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-semibold mb-1">Poznámka</p>
        <p className="text-sm text-muted-foreground">
          Správu uživatelů a šablon najdete v levém menu. Platby a Firebase
          konzoli spravujte přímo v Firebase Console.
        </p>
      </div>
    </div>
  );
}
