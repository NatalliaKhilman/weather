"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { Moon, Sun, LayoutDashboard, Crown, Shield } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isPremium } from "@/lib/subscription";

export function Header() {
  const { data: session, status } = useSession();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isPremiumUser = session?.user ? isPremium((session as any).user) : false;
  const isAdmin = (session as any)?.user?.role === "admin";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-sky-200/50 dark:border-sky-800/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="font-semibold text-lg flex items-center gap-2 text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors">
          <span className="bg-gradient-to-r from-sky-500 to-emerald-500 bg-clip-text text-transparent">Погода и валюты</span>
        </Link>
        <nav className="flex items-center gap-2">
          {session && (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard" className="text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300">
                  <LayoutDashboard className="mr-2 h-4 w-4 text-sky-500" />
                  Панель
                </Link>
              </Button>
              {isPremiumUser && (
                <span className="rounded-full bg-amber-400/25 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                  Премиум
                </span>
              )}
              {isAdmin && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin" className="text-violet-600 dark:text-violet-400 hover:text-violet-700">
                    <Shield className="mr-2 h-4 w-4 text-violet-500" />
                    Админ
                  </Link>
                </Button>
              )}
              <Button variant="ghost" size="sm" asChild>
                <Link href="/pricing" className="text-amber-600 dark:text-amber-400 hover:text-amber-700">
                  <Crown className="mr-2 h-4 w-4 text-amber-500" />
                  Тарифы
                </Link>
              </Button>
            </>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-amber-500 hover:text-amber-600">
                {resolvedTheme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                Светлая
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                Тёмная
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                Системная
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {status === "loading" ? (
            <span className="text-sm text-muted-foreground">...</span>
          ) : session ? (
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              Выйти
            </Button>
          ) : (
            <Button size="sm" onClick={() => signIn("google")}>
              Войти через Google
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
