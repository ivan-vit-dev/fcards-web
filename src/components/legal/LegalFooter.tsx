"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { openCookieSettings } from "./CookieConsent";

export function LegalFooter() {
  const locale = (useParams()?.locale as string) ?? "cs";
  return (
    <footer className="border-t border-border py-8 px-4 text-center text-sm text-muted-foreground space-y-2">
      <nav className="flex flex-wrap justify-center gap-x-5 gap-y-1">
        <Link href={`/${locale}/legal/privacy`} className="hover:text-foreground">
          Ochrana osobních údajů
        </Link>
        <Link href={`/${locale}/legal/terms`} className="hover:text-foreground">
          Podmínky použití
        </Link>
        <button type="button" onClick={openCookieSettings} className="hover:text-foreground">
          Nastavení cookies
        </button>
      </nav>
      <p>© {new Date().getFullYear()} Fotbalové Kartičky</p>
    </footer>
  );
}
