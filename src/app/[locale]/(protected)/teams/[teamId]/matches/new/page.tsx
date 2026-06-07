"use client";

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MatchForm } from "@/components/match/MatchForm";
import { useAuthStore } from "@/store/authStore";
import { useMatchesStore } from "@/store/appStore";
import { createMatch } from "@/lib/firebaseServices";
import type { Match } from "@/types";
import toast from "react-hot-toast";

export default function NewMatchPage() {
  const { user } = useAuthStore();
  const { addMatch } = useMatchesStore();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "cs";
  const teamId = params?.teamId as string;

  if (!user) return null;

  const handleSubmit = async (data: Partial<Match>) => {
    const match = await createMatch({ ...data, teamId });
    addMatch(match);
    toast.success("Zápas byl přidán.");
    router.push(`/${locale}/teams/${teamId}/matches/${match.id}`);
  };

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/${locale}/teams/${teamId}`}>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-display font-bold">Nový zápas</h1>
      </div>
      <div className="bg-card border border-border rounded-2xl p-6">
        <MatchForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
