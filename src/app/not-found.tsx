import Link from "next/link";
import "@/app/globals.css";

// Rendered for URLs outside [locale]. The root layout has no <html>/<body>, so this page provides them.
export default function RootNotFound() {
  return (
    <html lang="cs">
      <body className="min-h-screen flex items-center justify-center bg-background text-foreground font-sans">
        <div className="text-center space-y-3 p-6">
          <p className="text-4xl font-bold">404</p>
          <p className="text-sm text-muted-foreground">Stránka nenalezena · Page not found</p>
          <Link href="/cs" className="text-sm text-primary hover:underline">
            Fotbalové Kartičky
          </Link>
        </div>
      </body>
    </html>
  );
}
