"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Cookie } from "lucide-react";
import { enableAnalytics } from "@/lib/firebase";
import { Button } from "@/components/ui/button";

const KEY = "fk-cookie-consent"; // "all" | "necessary"
const OPEN_EVENT = "fk:cookie-settings";

/** Re-opens the cookie bar, e.g. from a "Nastavení cookies" link. */
export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

function readChoice(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** Opt-in bar for analytics cookies. Login/session storage is strictly necessary and needs no consent. */
export function CookieConsent() {
  const locale = (useParams()?.locale as string) ?? "cs";
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const choice = readChoice();
    if (choice === "all") void enableAnalytics();
    // Reading localStorage only works after mount, so the bar can't be decided during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    else if (!choice) setOpen(true);
    const reopen = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, reopen);
    return () => window.removeEventListener(OPEN_EVENT, reopen);
  }, []);

  const choose = (choice: "all" | "necessary") => {
    try {
      const previous = localStorage.getItem(KEY);
      localStorage.setItem(KEY, choice);
      // Analytics can't be stopped once loaded; reload so a withdrawal applies right away.
      if (previous === "all" && choice === "necessary") window.location.reload();
    } catch {
      // private mode: the choice applies to this visit only
    }
    if (choice === "all") void enableAnalytics();
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-label="Nastavení cookies"
      className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-xl rounded-2xl border border-border bg-card p-4 shadow-lg md:bottom-5"
    >
      <div className="flex gap-3">
        <Cookie className="h-5 w-5 shrink-0 text-primary mt-0.5" />
        <div className="space-y-3 min-w-0">
          <p className="text-sm">
            Nezbytné cookies používáme pro přihlášení. Se souhlasem použijeme i analytické cookies
            (Google Analytics), abychom viděli, co v aplikaci funguje.{" "}
            <Link href={`/${locale}/legal/privacy#cookies`} className="text-primary hover:underline">
              Více
            </Link>
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => choose("all")}>
              Povolit analytické
            </Button>
            <Button size="sm" variant="outline" onClick={() => choose("necessary")}>
              Jen nezbytné
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
