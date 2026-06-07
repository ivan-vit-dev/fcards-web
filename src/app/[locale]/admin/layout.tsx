"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { useRouter, useParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, Layers, ArrowLeft } from "lucide-react";

const adminNav = [
  { href: "/admin", label: "Přehled", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Uživatelé", icon: Users, exact: false },
  { href: "/admin/templates", label: "Šablony", icon: Layers, exact: false },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const locale = (params?.locale as string) ?? "cs";

  useEffect(() => {
    if (!loading && (!user || user.role !== "superAdmin")) {
      router.replace(`/${locale}/dashboard`);
    }
  }, [user, loading, router, locale]);

  if (loading || !user || user.role !== "superAdmin") return null;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Admin sidebar */}
      <aside className="w-52 shrink-0 border-r border-border bg-sidebar flex flex-col sticky top-0 h-screen">
        <div className="px-4 py-5 border-b border-sidebar-border">
          <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-1">
            Super Admin
          </p>
          <p className="font-display font-bold text-sm text-sidebar-foreground leading-tight">
            Fotbalové Kartičky
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {adminNav.map(({ href, label, icon: Icon, exact }) => {
            const fullHref = `/${locale}${href}`;
            const active = exact
              ? pathname === fullHref
              : pathname.startsWith(fullHref);
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

        <div className="px-2 py-3 border-t border-sidebar-border">
          <Link
            href={`/${locale}/dashboard`}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            Zpět do aplikace
          </Link>
        </div>
      </aside>

      {/* Page content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
