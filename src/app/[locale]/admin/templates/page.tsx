"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  getAllTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "@/lib/firebaseServices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import type { Template, SubscriptionTier } from "@/types";

const TIER_OPTIONS: { value: SubscriptionTier; label: string }[] = [
  { value: "free", label: "Free" },
  { value: "premium", label: "Premium" },
  { value: "team", label: "Team" },
  { value: "club", label: "Klub" },
];

const schema = z.object({
  name: z.string().min(2, "Název musí mít alespoň 2 znaky"),
  nameCs: z.string().min(2, "Český název musí mít alespoň 2 znaky"),
  category: z.string().min(1, "Zadejte kategorii"),
  requiredTier: z.enum(["free", "premium", "team", "club"]),
});

type FormData = z.infer<typeof schema>;

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { requiredTier: "free" },
  });

  const load = () => {
    setLoading(true);
    getAllTemplates()
      .then(setTemplates)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (data: FormData) => {
    setCreating(true);
    try {
      const tpl = await createTemplate({
        name: data.name,
        nameCs: data.nameCs,
        category: data.category,
        requiredTier: data.requiredTier,
        previewURL: "",
        isActive: true,
      });
      setTemplates((prev) => [tpl, ...prev]);
      toast.success("Šablona byla vytvořena");
      setDialogOpen(false);
      reset();
    } catch {
      toast.error("Nepodařilo se vytvořit šablonu");
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (tpl: Template) => {
    setToggling(tpl.id);
    try {
      await updateTemplate(tpl.id, { isActive: !tpl.isActive });
      setTemplates((prev) =>
        prev.map((t) => (t.id === tpl.id ? { ...t, isActive: !t.isActive } : t))
      );
    } catch {
      toast.error("Nepodařilo se změnit stav");
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = async (tpl: Template) => {
    if (!confirm(`Smazat šablonu "${tpl.nameCs}"?`)) return;
    setDeleting(tpl.id);
    try {
      await deleteTemplate(tpl.id);
      setTemplates((prev) => prev.filter((t) => t.id !== tpl.id));
      toast.success("Šablona byla smazána");
    } catch {
      toast.error("Nepodařilo se smazat šablonu");
    } finally {
      setDeleting(null);
    }
  };

  const tierBadge: Record<string, string> = {
    free: "bg-zinc-500/20 text-zinc-400",
    premium: "bg-amber-500/20 text-amber-400",
    team: "bg-blue-500/20 text-blue-400",
    club: "bg-purple-500/20 text-purple-400",
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Šablony</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "Načítám…" : `${templates.length} šablon`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Obnovit
          </Button>
          <Button size="sm" onClick={() => { reset(); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Nová šablona
          </Button>
        </div>
      </div>

      {/* Template table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left p-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Šablona
              </th>
              <th className="text-left p-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Kategorie
              </th>
              <th className="text-left p-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Min. plán
              </th>
              <th className="text-left p-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Aktivní
              </th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="p-3"><Skeleton className="h-4 w-40" /></td>
                    <td className="p-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="p-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="p-3"><Skeleton className="h-4 w-10" /></td>
                    <td className="p-3" />
                  </tr>
                ))
              : templates.map((tpl) => (
                  <tr
                    key={tpl.id}
                    className="border-b border-border hover:bg-muted/30 transition-colors"
                  >
                    <td className="p-3">
                      <p className="font-medium">{tpl.nameCs}</p>
                      <p className="text-xs text-muted-foreground">{tpl.name}</p>
                    </td>
                    <td className="p-3">
                      <span className="text-xs text-muted-foreground font-mono">
                        {tpl.category}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${tierBadge[tpl.requiredTier] ?? ""}`}
                      >
                        {tpl.requiredTier}
                      </span>
                    </td>
                    <td className="p-3">
                      <Switch
                        checked={tpl.isActive}
                        disabled={toggling === tpl.id}
                        onCheckedChange={() => handleToggle(tpl)}
                      />
                    </td>
                    <td className="p-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        disabled={deleting === tpl.id}
                        onClick={() => handleDelete(tpl)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>

        {!loading && templates.length === 0 && (
          <div className="p-8 text-center text-muted-foreground text-sm">
            Žádné šablony. Vytvořte první.
          </div>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nová šablona</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleCreate)} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="tpl-name">Název (anglicky) *</Label>
              <Input id="tpl-name" {...register("name")} placeholder="Classic Gold" />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tpl-nameCs">Název (česky) *</Label>
              <Input id="tpl-nameCs" {...register("nameCs")} placeholder="Klasické zlato" />
              {errors.nameCs && (
                <p className="text-xs text-destructive">{errors.nameCs.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tpl-category">Kategorie</Label>
              <Input
                id="tpl-category"
                {...register("category")}
                placeholder="gold, dark, retro, …"
              />
              {errors.category && (
                <p className="text-xs text-destructive">{errors.category.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Minimální plán</Label>
              <Select
                defaultValue="free"
                onValueChange={(v) =>
                  setValue("requiredTier", v as SubscriptionTier)
                }
              >
                <SelectTrigger>
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
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Zrušit
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? "Vytvářím…" : "Vytvořit"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
