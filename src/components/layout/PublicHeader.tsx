"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Moon, Sun, CreditCard, Menu } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuthStore } from "@/store/authStore";

export function PublicHeader() {
  const { user } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const params = useParams();
  const locale = (params?.locale as string) ?? "cs";

  return (
    <header className="sticky top-0 z-50 border-b border-border glass">
      <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-4">
        {/* Brand */}
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg gradient-brand flex items-center justify-center">
            <CreditCard className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-base gradient-text hidden sm:block">
            Fotbalové Kartičky
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <Link href={`/${locale}#features`} className="hover:text-foreground transition-colors">
            Funkce
          </Link>
          <Link href={`/${locale}#pricing`} className="hover:text-foreground transition-colors">
            Ceny
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {user ? (
            <Link href={`/${locale}/dashboard`}>
              <Button size="sm">Přejít do aplikace</Button>
            </Link>
          ) : (
            <>
              <Link href={`/${locale}/auth/login`} className="hidden sm:block">
                <Button variant="ghost" size="sm">
                  Přihlásit se
                </Button>
              </Link>
              <Link href={`/${locale}/auth/register`}>
                <Button size="sm">Začít zdarma</Button>
              </Link>
            </>
          )}

          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger className="md:hidden inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors">
              <Menu className="h-4 w-4" />
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <nav className="flex flex-col gap-4 mt-8 text-sm font-medium">
                <Link href={`/${locale}#features`} className="hover:text-primary transition-colors">
                  Funkce
                </Link>
                <Link href={`/${locale}#pricing`} className="hover:text-primary transition-colors">
                  Ceny
                </Link>
                <Link href={`/${locale}/auth/login`} className="hover:text-primary transition-colors">
                  Přihlásit se
                </Link>
                <Link href={`/${locale}/auth/register`}>
                  <Button size="sm" className="w-full">Začít zdarma</Button>
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
