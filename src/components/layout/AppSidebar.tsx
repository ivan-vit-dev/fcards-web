"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UsersRound,
  CreditCard,
  Sparkles,
  Printer,
  Trophy,
  Settings,
  LogOut,
  Swords,
  Building2,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

const navItems = [
  { href: "/dashboard", label: "Přehled", icon: LayoutDashboard },
  { href: "/players", label: "Hráči", icon: Users },
  { href: "/teams", label: "Týmy", icon: UsersRound },
  { href: "/cards", label: "Kartičky", icon: CreditCard },
  { href: "/matches", label: "Zápasy", icon: Swords },
  { href: "/studio", label: "AI Studio", icon: Sparkles },
  { href: "/print", label: "Tisk", icon: Printer },
  { href: "/achievements", label: "Úspěchy", icon: Trophy },
  { href: "/settings", label: "Nastavení", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const locale = (params?.locale as string) ?? "cs";
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await signOut(auth);
    logout();
  };

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-border bg-sidebar h-screen sticky top-0">
      {/* Brand */}
      <div className="px-4 py-5 border-b border-sidebar-border">
        <Link href={`/${locale}/dashboard`} className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg gradient-brand flex items-center justify-center">
            <CreditCard className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-sm leading-tight text-sidebar-foreground">
            Fotbalové<br />Kartičky
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const fullHref = `/${locale}${href}`;
          const active = pathname.startsWith(fullHref);
          return (
            <Link
              key={href}
              href={fullHref}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Role-based links */}
      {(user?.role === "clubAdmin" || user?.role === "superAdmin") && (
        <div className="px-2 pb-1 border-t border-sidebar-border pt-2">
          {(user.role === "clubAdmin" || user.role === "superAdmin") && (
            <Link
              href={`/${locale}/settings/club`}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                pathname.startsWith(`/${locale}/settings/club`)
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Building2 className="h-4 w-4 shrink-0" />
              Klub
            </Link>
          )}
          {user.role === "superAdmin" && (
            <Link
              href={`/${locale}/admin`}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                pathname.startsWith(`/${locale}/admin`)
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Shield className="h-4 w-4 shrink-0" />
              Administrace
            </Link>
          )}
        </div>
      )}

      {/* Logout */}
      <div className="px-2 py-3 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors w-full"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Odhlásit se
        </button>
      </div>
    </aside>
  );
}
