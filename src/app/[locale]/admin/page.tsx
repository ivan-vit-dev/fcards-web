"use client";

import { useEffect, useState } from "react";
import { getAdminStats, seedDefaultData } from "@/lib/firebaseServices";
import { Users, CreditCard, Building2, Layers, DatabaseZap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

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
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch((err) => {
        console.warn("[getAdminStats]", err);
        toast.error("Nepodařilo se načíst statistiky");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const { templates, achievements } = await seedDefaultData();
      toast.success(
        `Šablony: ${templates.created} nových, ${templates.updated} aktualizováno. ` +
          `Úspěchy: ${achievements.created} nových, ${achievements.updated} aktualizováno.`,
        { duration: 6000 }
      );
      setStats(await getAdminStats());
    } catch (err) {
      console.warn("[seedDefaultData]", err);
      toast.error("Nepodařilo se nahrát výchozí data");
    } finally {
      setSeeding(false);
    }
  };

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

      <div className="rounded-xl border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <p className="text-sm font-semibold mb-1">Výchozí data</p>
          <p className="text-sm text-muted-foreground">
            Nahraje základní šablony kartiček a definice úspěchů. Lze spustit
            opakovaně — existující záznamy se aktualizují, nevzniknou duplicity.
          </p>
        </div>
        <Button onClick={handleSeed} disabled={seeding} className="gap-2 shrink-0">
          <DatabaseZap className="h-4 w-4" />
          {seeding ? "Nahrávám…" : "Nahrát výchozí data"}
        </Button>
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
