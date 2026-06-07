"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter, useParams } from "next/navigation";
import {
  getClubDoc,
  createClub,
  updateClub,
  updateUserDoc,
} from "@/lib/firebaseServices";
import { ClubForm } from "@/components/club/ClubForm";
import { ClubBrandingEditor } from "@/components/club/ClubBrandingEditor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Layers } from "lucide-react";
import type { Club } from "@/types";

export default function ClubSettingsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "cs";

  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    if (user.role !== "clubAdmin" && user.role !== "superAdmin") {
      router.replace(`/${locale}/dashboard`);
      return;
    }
    if (!user.clubId) {
      setLoading(false);
      return;
    }
    getClubDoc(user.clubId).then((c) => {
      setClub(c);
      setLoading(false);
    });
  }, [user, router, locale]);

  const handleCreate = async (data: Partial<Club>) => {
    if (!user) return;
    const newClub = await createClub({ ...data, ownerId: user.uid });
    await updateUserDoc(user.uid, { clubId: newClub.id } as never);
    setClub(newClub);
  };

  const handleUpdate = async (data: Partial<Club>) => {
    if (!club) return;
    await updateClub(club.id, data);
    setClub((prev) => (prev ? { ...prev, ...data } : prev));
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full max-w-md" />
      </div>
    );
  }

  const tierLabels: Record<string, string> = {
    free: "Free",
    premium: "Premium",
    team: "Team",
    club: "Klub",
  };

  return (
    <div className="p-6 max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Klub</h1>
          <p className="text-sm text-muted-foreground">
            Správa klubu a brandingu
          </p>
        </div>
        {club && (
          <Badge variant="outline" className="ml-auto">
            {tierLabels[club.subscriptionTier] ?? club.subscriptionTier}
          </Badge>
        )}
      </div>

      {/* No club yet */}
      {!club ? (
        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">
              Zatím nemáte vytvořený klub. Vytvořte jej a začněte spravovat více
              týmů s vlastním brandingem.
            </p>
          </div>
          <ClubForm onSubmit={handleCreate} />
        </div>
      ) : (
        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Informace</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
          </TabsList>

          {/* Details tab */}
          <TabsContent value="details" className="pt-5 space-y-6">
            <ClubForm initialData={club} onSubmit={handleUpdate} />

            <div className="pt-5 border-t border-border">
              <p className="text-sm font-semibold mb-3">Statistiky klubu</p>
              <div className="flex gap-3">
                <div className="bg-muted/50 rounded-xl p-4 text-center flex-1">
                  <Layers className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                  <p className="text-2xl font-bold font-display">
                    {club.teamIds.length}
                  </p>
                  <p className="text-xs text-muted-foreground">Týmů</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 text-center flex-1">
                  <Users className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                  <p className="text-2xl font-bold font-display">
                    {club.memberCount}
                  </p>
                  <p className="text-xs text-muted-foreground">Členů</p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Branding tab */}
          <TabsContent value="branding" className="pt-5">
            {user.subscriptionTier === "club" ? (
              <ClubBrandingEditor club={club} onUpdate={handleUpdate} />
            ) : (
              <div className="rounded-xl border border-border bg-muted/30 p-6 text-center space-y-3">
                <Building2 className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="font-semibold">Branding je dostupný v plánu Klub</p>
                <p className="text-sm text-muted-foreground">
                  Nahrajte logo klubu a nastavte vlastní barvy karet.
                </p>
                <button
                  onClick={() =>
                    router.push(`/${locale}/settings/subscription`)
                  }
                  className="text-sm text-primary underline underline-offset-2"
                >
                  Upgradovat plán →
                </button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
