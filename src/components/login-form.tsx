"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { LogIn } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({ blocked }: { blocked?: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Введите email и пароль.");
      return;
    }
    setLoading(true);
    const res = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      callbackUrl: "/dashboard",
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Неверный email или пароль.");
      return;
    }
    if (res?.url) window.location.href = res.url;
  }

  return (
    <Card className="w-full max-w-sm border-sky-200 dark:border-sky-800 bg-gradient-to-br from-sky-50/50 to-white dark:from-sky-950/30 dark:to-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sky-700 dark:text-sky-300">
          <LogIn className="h-5 w-5 text-sky-500" />
          Вход
        </CardTitle>
        <CardDescription>
          Войдите через email и пароль или через Google.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {blocked && (
          <p className="text-sm text-destructive">
            Ваш аккаунт заблокирован. Обратитесь в поддержку.
          </p>
        )}
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        <form onSubmit={handleCredentialsSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={loading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Вход…" : "Войти по email"}
          </Button>
        </form>
        <div className="relative">
          <span className="bg-card absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </span>
          <span className="bg-card relative flex justify-center text-xs uppercase text-muted-foreground">
            или
          </span>
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={loading}
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        >
          Войти через Google
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Нет аккаунта?{" "}
          <Link href="/register" className="text-primary underline underline-offset-4">
            Зарегистрироваться
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
