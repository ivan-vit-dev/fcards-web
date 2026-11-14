import { ShieldAlert } from "lucide-react";
import { OPERATOR } from "@/lib/legal";
import { REPORT_REASONS } from "@/lib/moderation";
import type { ReportReason } from "@/types";

/** Tells the owner their content was hidden by moderation and can't be re-published. */
export function ModerationNotice({ what, reason }: { what: "Kartičku" | "Profil"; reason?: ReportReason }) {
  return (
    <div className="flex gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs">
      <ShieldAlert className="h-4 w-4 shrink-0 text-destructive" />
      <p>
        <span className="font-medium">
          {what} skryla moderace{reason ? ` (${REPORT_REASONS[reason].label.toLowerCase()})` : ""}.
        </span>{" "}
        {what === "Kartičku"
          ? "Dokud ji neprověříme, nejde zveřejnit; vidíte ji jen vy."
          : "Dokud ho neprověříme, nejde zveřejnit; vidíte ho jen vy."} Jde-li o omyl, napište nám na{" "}
        <a href={`mailto:${OPERATOR.email}`} className="underline">
          {OPERATOR.email}
        </a>
        .
      </p>
    </div>
  );
}
