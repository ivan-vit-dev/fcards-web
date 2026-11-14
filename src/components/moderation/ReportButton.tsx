"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Flag as FlagIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { reportContent, type ReportTargetRef } from "@/lib/firebaseServices";
import { REPORT_REASONS } from "@/lib/moderation";
import { cn } from "@/lib/utils";
import type { ReportReason } from "@/types";

/** "Nahlásit" link + dialog on public card / player pages. Guests can report too. */
export function ReportButton({ target, what }: { target: ReportTargetRef; what: "kartičku" | "profil" }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!reason) return;
    if (reason === "other" && !note.trim()) {
      toast.error("Popište prosím, co je špatně.");
      return;
    }
    setSending(true);
    try {
      await reportContent(target, reason, note);
      setSent(true);
    } catch (err) {
      console.warn("[Report]", err);
      toast.error("Nahlášení se nepodařilo odeslat. Zkuste to znovu.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
      >
        <FlagIcon className="h-3 w-3" />
        Nahlásit {what}
      </button>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) {
            setReason(null);
            setNote("");
            setSent(false);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{sent ? "Děkujeme" : `Nahlásit ${what}`}</DialogTitle>
            <DialogDescription>
              {sent
                ? "Nahlášení jsme přijali a prověříme ho. Když obsah nahlásí víc lidí, skryjeme ho hned, ještě před kontrolou."
                : "Vyberte, co je špatně. Nahlášení je anonymní – vlastník se nedozví, kdo ho poslal."}
            </DialogDescription>
          </DialogHeader>

          {sent ? (
            <Button onClick={() => setOpen(false)}>Zavřít</Button>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                {(Object.keys(REPORT_REASONS) as ReportReason[]).map((id) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={reason === id}
                    onClick={() => setReason(id)}
                    className={cn(
                      "w-full rounded-lg border p-2.5 text-left transition-colors",
                      reason === id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                    )}
                  >
                    <span className="block text-sm font-medium">{REPORT_REASONS[id].label}</span>
                    <span className="block text-xs text-muted-foreground">{REPORT_REASONS[id].hint}</span>
                  </button>
                ))}
              </div>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder={reason === "other" ? "Co je špatně?" : "Poznámka (nepovinné)"}
              />
              <Button className="w-full" disabled={!reason || sending} onClick={submit}>
                {sending ? "Odesílám…" : "Odeslat nahlášení"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
