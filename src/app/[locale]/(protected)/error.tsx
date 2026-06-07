"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ProtectedError({ error, reset }: Props) {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) ?? "cs";

  useEffect(() => {
    console.error("[ProtectedError]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-6">
      <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertTriangle className="h-7 w-7 text-destructive" />
      </div>

      <div className="space-y-2 max-w-sm">
        <h2 className="text-xl font-display font-bold">Nastala chyba</h2>
        <p className="text-sm text-muted-foreground">
          Nepodařilo se načíst tuto sekci. Zkuste to znovu nebo se vraťte na přehled.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/50 font-mono mt-1">
            {error.digest}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <Button size="sm" onClick={reset} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          Zkusit znovu
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => router.push(`/${locale}`)}
        >
          <Home className="h-3.5 w-3.5" />
          Přehled
        </Button>
      </div>
    </div>
  );
}
