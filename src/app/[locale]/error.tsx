"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function LocaleError({ error, reset }: Props) {
  useEffect(() => {
    console.error("[LocaleError]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-display font-bold">Nastala chyba</h1>
          <p className="text-sm text-muted-foreground">
            Omlouváme se, něco se pokazilo. Zkuste stránku obnovit.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground/60 font-mono">
              Kód: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Zkusit znovu
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = "/")}>
            Zpět na hlavní stránku
          </Button>
        </div>
      </div>
    </div>
  );
}
