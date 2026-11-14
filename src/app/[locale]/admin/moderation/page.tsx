"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { EyeOff, ExternalLink, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CardPreview } from "@/components/card/CardPreview";
import {
  getCardDoc,
  getModerationQueue,
  getPlayerDoc,
  getRecentPublicCards,
  moderateContent,
  type ReportTargetRef,
} from "@/lib/firebaseServices";
import { REPORT_REASONS } from "@/lib/moderation";
import { cn } from "@/lib/utils";
import type { Card, ContentReport, Player, ReportReason } from "@/types";

type Tab = "queue" | "recent";

const STATUS_LABEL: Record<ContentReport["status"], { label: string; className: string }> = {
  open: { label: "Nahlášeno", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  hidden: { label: "Automaticky skryto", className: "bg-destructive/15 text-destructive" },
  removed: { label: "Skryto", className: "bg-muted text-muted-foreground" },
  dismissed: { label: "Zamítnuto", className: "bg-muted text-muted-foreground" },
};

function topReason(r: ContentReport): ReportReason | undefined {
  const entries = Object.entries(r.reasons ?? {}) as [ReportReason, number][];
  return entries.sort((a, b) => b[1] - a[1])[0]?.[0];
}

/** Loads what was reported — admins can read hidden cards/players too. */
function ReportedPreview({ report }: { report: ContentReport }) {
  const [card, setCard] = useState<Card | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);

  useEffect(() => {
    if (report.targetType === "card") {
      getCardDoc(report.targetId)
        .then(async (c) => {
          setCard(c);
          if (c) setPlayer(await getPlayerDoc(c.userId, c.playerId));
        })
        .catch(() => undefined);
    } else {
      getPlayerDoc(report.ownerId, report.targetId).then(setPlayer).catch(() => undefined);
    }
  }, [report]);

  if (report.targetType === "card") {
    return card ? (
      <CardPreview card={card} player={player ?? undefined} size="sm" flat />
    ) : (
      <Skeleton className="w-[120px] h-[168px] rounded-xl" />
    );
  }
  return (
    <div className="w-[120px] space-y-1 text-center">
      {player?.photoURL ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={player.photoURL} alt="" className="w-[120px] h-[120px] rounded-xl object-cover" />
      ) : (
        <div className="w-[120px] h-[120px] rounded-xl bg-muted" />
      )}
      <p className="text-xs font-medium truncate">{player?.displayName ?? report.title}</p>
    </div>
  );
}

export default function ModerationPage() {
  const locale = (useParams()?.locale as string) ?? "cs";
  const [tab, setTab] = useState<Tab>("queue");
  const [queue, setQueue] = useState<ContentReport[] | null>(null);
  const [recent, setRecent] = useState<Card[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const loadQueue = useCallback(
    () =>
      getModerationQueue()
        // Auto-hidden first (content is down until reviewed), then by most reports.
        .then((q) =>
          setQueue(q.sort((a, b) => Number(b.status === "hidden") - Number(a.status === "hidden") || b.count - a.count))
        )
        .catch((err) => {
          console.warn("[Moderation] queue", err);
          toast.error("Frontu se nepodařilo načíst.");
          setQueue([]);
        }),
    []
  );

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  useEffect(() => {
    if (tab !== "recent" || recent) return;
    getRecentPublicCards()
      .then(setRecent)
      .catch((err) => {
        console.warn("[Moderation] recent", err);
        toast.error("Kartičky se nepodařilo načíst (chybí index? nasaďte firestore:indexes).");
        setRecent([]);
      });
  }, [tab, recent]);

  const act = async (key: string, target: ReportTargetRef, action: "hide" | "restore" | "dismiss", reason?: ReportReason) => {
    setBusy(key);
    try {
      await moderateContent(target, action, reason);
      toast.success(action === "hide" ? "Skryto." : action === "restore" ? "Obnoveno a znovu veřejné." : "Nahlášení zamítnuto.");
      await loadQueue();
      if (action === "hide") setRecent((r) => r?.filter((c) => c.id !== target.targetId) ?? r);
    } catch (err) {
      console.warn("[Moderation] action", err);
      toast.error("Akce se nepodařila.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold">Moderování</h1>
        <p className="text-sm text-muted-foreground">
          Nahlášené kartičky a profily. Po 3 nahlášeních od různých lidí se obsah skryje automaticky a čeká na
          vaše rozhodnutí.
        </p>
      </div>

      <div className="flex gap-1.5">
        {(
          [
            ["queue", `Fronta${queue ? ` (${queue.length})` : ""}`],
            ["recent", "Nejnovější veřejné kartičky"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
              tab === id ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted/50"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "queue" &&
        (queue === null ? (
          <Skeleton className="h-40 w-full rounded-xl" />
        ) : queue.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Nic k prověření. 🎉
          </p>
        ) : (
          <div className="space-y-3">
            {queue.map((r) => {
              const target = { targetType: r.targetType, targetId: r.targetId, ownerId: r.ownerId };
              const reason = topReason(r);
              const status = STATUS_LABEL[r.status];
              return (
                <div key={r.id} className="flex flex-col sm:flex-row gap-4 rounded-xl border border-border bg-card p-4">
                  <div className="shrink-0 self-center sm:self-start">
                    <ReportedPreview report={r} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{r.title}</p>
                      <span className="text-xs text-muted-foreground">
                        {r.targetType === "card" ? "Kartička" : "Profil hráče"}
                      </span>
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", status.className)}>
                        {status.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(Object.entries(r.reasons ?? {}) as [ReportReason, number][]).map(([id, n]) => (
                        <span key={id} className="rounded-md bg-muted px-2 py-0.5 text-xs">
                          {REPORT_REASONS[id]?.label ?? id} × {n}
                        </span>
                      ))}
                    </div>
                    {r.notes?.length > 0 && (
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        {r.notes.map((n, i) => (
                          <li key={i} className="rounded-md border border-border px-2 py-1">
                            „{n}“
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="gap-1.5"
                        disabled={busy === r.id}
                        onClick={() => act(r.id, target, "hide", reason)}
                      >
                        <EyeOff className="h-3.5 w-3.5" />
                        {r.status === "hidden" ? "Potvrdit skrytí" : "Skrýt"}
                      </Button>
                      {r.status === "hidden" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          disabled={busy === r.id}
                          onClick={() => act(r.id, target, "restore")}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Obnovit (neoprávněné)
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          disabled={busy === r.id}
                          onClick={() => act(r.id, target, "dismiss")}
                        >
                          <Check className="h-3.5 w-3.5" />
                          Zamítnout nahlášení
                        </Button>
                      )}
                      {r.status === "open" && (
                        <Link href={`/${locale}${r.link}`} target="_blank">
                          <Button size="sm" variant="ghost" className="gap-1.5">
                            <ExternalLink className="h-3.5 w-3.5" />
                            Otevřít
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

      {tab === "recent" &&
        (recent === null ? (
          <Skeleton className="h-40 w-full rounded-xl" />
        ) : recent.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Zatím žádné veřejné kartičky.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {recent.map((c) => (
              <div key={c.id} className="space-y-1.5">
                <Link href={`/${locale}/card/${c.shareSlug}`} target="_blank" className="block">
                  <CardPreview card={c} size="sm" flat />
                </Link>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full gap-1.5 text-destructive"
                  disabled={busy === c.id}
                  onClick={() =>
                    act(c.id, { targetType: "card", targetId: c.id, ownerId: c.userId }, "hide", "inappropriate")
                  }
                >
                  <EyeOff className="h-3.5 w-3.5" />
                  Skrýt
                </Button>
              </div>
            ))}
          </div>
        ))}
    </div>
  );
}
