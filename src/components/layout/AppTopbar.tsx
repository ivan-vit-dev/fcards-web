"use client";

import { useRouter, useParams } from "next/navigation";
import { Moon, Sun, LogOut, Settings } from "lucide-react";
import { useTheme } from "next-themes";
import { signOut } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { auth } from "@/lib/firebase";
import { useAuthStore } from "@/store/authStore";
import { getXPToNextLevel } from "@/lib/utils";

export function AppTopbar() {
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "cs";

  const xpInfo = user ? getXPToNextLevel(user.xp) : null;

  const handleLogout = async () => {
    await signOut(auth);
    logout();
    router.push(`/${locale}/auth/login`);
  };

  const initials = user?.displayName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?";

  return (
    <header className="h-14 border-b border-border bg-card/80 backdrop-blur sticky top-0 z-40 flex items-center px-4 gap-3">
      {/* XP bar — desktop only */}
      {xpInfo && (
        <div className="hidden md:flex items-center gap-2 flex-1 max-w-xs">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Lv {xpInfo.level}
          </span>
          <Progress
            value={(xpInfo.current / xpInfo.required) * 100}
            className="h-1.5 flex-1"
          />
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {xpInfo.current}/{xpInfo.required} XP
          </span>
        </div>
      )}

      <div className="flex-1" />

      {/* Theme toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Přepnout téma</span>
      </Button>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger className="rounded-full h-8 w-8 flex items-center justify-center outline-none cursor-pointer">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.photoURL} alt={user?.displayName} />
            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium truncate">{user?.displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push(`/${locale}/settings`)}>
            <Settings className="mr-2 h-4 w-4" />
            Nastavení
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Odhlásit se
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
