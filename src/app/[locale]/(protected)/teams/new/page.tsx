"use client";

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TeamForm } from "@/components/team/TeamForm";
import { useAuthStore } from "@/store/authStore";
import { useTeamsStore } from "@/store/appStore";
import { createTeam } from "@/lib/firebaseServices";
import type { Team } from "@/types";
import toast from "react-hot-toast";

export default function NewTeamPage() {
  const { user } = useAuthStore();
  const { addTeam } = useTeamsStore();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "cs";

  if (!user) return null;

  const handleSubmit = async (data: Partial<Team>) => {
    const team = await createTeam({ ...data, coachId: user.uid });
    addTeam(team);
    toast.success("Tým byl vytvořen.");
    router.push(`/${locale}/teams/${team.id}`);
  };

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/${locale}/teams`}>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-display font-bold">Nový tým</h1>
      </div>
      <div className="bg-card border border-border rounded-2xl p-6">
        <TeamForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
