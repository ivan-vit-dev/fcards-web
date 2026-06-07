"use client";

import { useEffect, useState } from "react";
import { getAllUsers, updateUserDoc } from "@/lib/firebaseServices";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import type { User, UserRole, SubscriptionTier } from "@/types";

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "player", label: "Hráč" },
  { value: "parent", label: "Rodič" },
  { value: "coach", label: "Trenér" },
  { value: "clubAdmin", label: "Admin klubu" },
  { value: "superAdmin", label: "Super Admin" },
];

const TIER_OPTIONS: { value: SubscriptionTier; label: string }[] = [
  { value: "free", label: "Free" },
  { value: "premium", label: "Premium" },
  { value: "team", label: "Team" },
  { value: "club", label: "Klub" },
];

const ROLE_BADGE: Record<UserRole, string> = {
  guest: "bg-zinc-500/20 text-zinc-400",
  player: "bg-blue-500/20 text-blue-400",
  parent: "bg-teal-500/20 text-teal-400",
  coach: "bg-orange-500/20 text-orange-400",
  clubAdmin: "bg-purple-500/20 text-purple-400",
  superAdmin: "bg-red-500/20 text-red-400",
};

interface EditState {
  role: UserRole;
  tier: SubscriptionTier;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState<Record<string, EditState>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const load = () => {
    setLoading(true);
    getAllUsers(200)
      .then((list) => {
        setUsers(list);
        const initial: Record<string, EditState> = {};
        list.forEach((u) => {
          initial[u.uid] = { role: u.role, tier: u.subscriptionTier };
        });
        setEdits(initial);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const setEdit = <K extends keyof EditState>(
    uid: string,
    field: K,
    value: EditState[K]
  ) => {
    setEdits((prev) => ({
      ...prev,
      [uid]: { ...(prev[uid] ?? { role: "player" as UserRole, tier: "free" as SubscriptionTier }), [field]: value },
    }));
  };

  const handleSave = async (user: User) => {
    const edit = edits[user.uid];
    if (!edit) return;
    setSaving((s) => ({ ...s, [user.uid]: true }));
    try {
      await updateUserDoc(user.uid, {
        role: edit.role,
        subscriptionTier: edit.tier,
      } as never);
      setUsers((list) =>
        list.map((u) =>
          u.uid === user.uid
            ? { ...u, role: edit.role, subscriptionTier: edit.tier }
            : u
        )
      );
      toast.success("Uloženo");
    } catch {
      toast.error("Nepodařilo se uložit");
    } finally {
      setSaving((s) => ({ ...s, [user.uid]: false }));
    }
  };

  const isDirty = (user: User) => {
    const e = edits[user.uid];
    return e && (e.role !== user.role || e.tier !== user.subscriptionTier);
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Uživatelé</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "Načítám…" : `${users.length} uživatelů`}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Obnovit
        </Button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left p-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Uživatel
              </th>
              <th className="text-left p-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Role
              </th>
              <th className="text-left p-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Plán
              </th>
              <th className="text-left p-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                XP / Level
              </th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="p-3">
                      <Skeleton className="h-4 w-40" />
                    </td>
                    <td className="p-3">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="p-3">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="p-3">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="p-3" />
                  </tr>
                ))
              : users.map((u) => (
                  <tr
                    key={u.uid}
                    className="border-b border-border hover:bg-muted/30 transition-colors"
                  >
                    {/* User info */}
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-primary">
                            {u.displayName?.[0]?.toUpperCase() ?? "?"}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate max-w-[160px]">
                            {u.displayName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Role select */}
                    <td className="p-3">
                      <Select
                        value={edits[u.uid]?.role ?? u.role}
                        onValueChange={(v) =>
                          setEdit(u.uid, "role", v as UserRole)
                        }
                      >
                        <SelectTrigger className="h-8 w-36 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLE_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              <span
                                className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${ROLE_BADGE[o.value]}`}
                              >
                                {o.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>

                    {/* Tier select */}
                    <td className="p-3">
                      <Select
                        value={edits[u.uid]?.tier ?? u.subscriptionTier}
                        onValueChange={(v) =>
                          setEdit(u.uid, "tier", v as SubscriptionTier)
                        }
                      >
                        <SelectTrigger className="h-8 w-28 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIER_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>

                    {/* XP / Level */}
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-xs font-mono">
                          Lv {u.level}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {u.xp.toLocaleString("cs")} XP
                        </span>
                      </div>
                    </td>

                    {/* Save button */}
                    <td className="p-3">
                      {isDirty(u) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2"
                          disabled={saving[u.uid]}
                          onClick={() => handleSave(u)}
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          {saving[u.uid] ? "…" : "Uložit"}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
