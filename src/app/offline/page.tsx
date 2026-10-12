"use client";

import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="flex flex-col items-center space-y-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <WifiOff className="h-7 w-7 text-primary" />
        </div>

        <div className="max-w-sm space-y-2">
          <h1 className="font-display text-xl font-bold">Jste offline</h1>
          <p className="text-sm text-muted-foreground">
            Nelze se připojit k internetu. Zkontrolujte připojení a zkuste to znovu.
          </p>
        </div>

        <Button size="sm" className="gap-1.5" onClick={() => window.location.reload()}>
          <RefreshCw className="h-3.5 w-3.5" />
          Zkusit znovu
        </Button>
      </div>
    </div>
  );
}
