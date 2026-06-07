import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle } from "lucide-react";
import type { AIStatus } from "@/types";

interface Props {
  status: AIStatus;
  className?: string;
  label?: string;
}

const STATUS_LABELS: Record<AIStatus, string> = {
  pending: "Čekám na zpracování…",
  processing: "Generuji…",
  done: "Hotovo!",
  error: "Chyba při generování",
};

export function AIProgressIndicator({ status, className, label }: Props) {
  const isActive = status === "pending" || status === "processing";

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      {/* Ring */}
      <div className="relative h-16 w-16">
        {isActive ? (
          <>
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64">
              <circle
                cx="32" cy="32" r="28"
                fill="none"
                stroke="var(--muted)"
                strokeWidth="4"
              />
              <circle
                cx="32" cy="32" r="28"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="175.9"
                strokeDashoffset={status === "processing" ? "44" : "140"}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: "var(--primary)" }}
              />
            </div>
          </>
        ) : status === "done" ? (
          <CheckCircle2 className="h-16 w-16 text-green-500" />
        ) : (
          <XCircle className="h-16 w-16 text-destructive" />
        )}
      </div>

      <p className={cn(
        "text-sm font-medium",
        status === "done" ? "text-green-600 dark:text-green-400" :
        status === "error" ? "text-destructive" :
        "text-muted-foreground"
      )}>
        {label ?? STATUS_LABELS[status]}
      </p>
    </div>
  );
}
