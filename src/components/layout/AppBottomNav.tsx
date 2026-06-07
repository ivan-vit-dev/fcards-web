"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Sparkles,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Přehled", icon: LayoutDashboard },
  { href: "/players", label: "Hráči", icon: Users },
  { href: "/cards", label: "Kartičky", icon: CreditCard },
  { href: "/studio", label: "Studio", icon: Sparkles },
  { href: "/achievements", label: "Úspěchy", icon: Trophy },
];

export function AppBottomNav() {
  const pathname = usePathname();
  const params = useParams();
  const locale = (params?.locale as string) ?? "cs";

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map(({ href, label, icon: Icon }) => {
          const fullHref = `/${locale}${href}`;
          const active = pathname.startsWith(fullHref);
          return (
            <Link
              key={href}
              href={fullHref}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors min-w-0",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
              <span className="text-[10px] font-medium truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
