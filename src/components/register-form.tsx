"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { UserPlus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerUser } from "@/app/register/actions";

export function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Введите email.");
      return;
    }
    if (password.length < 8) {
      setError("Пароль должен быть не менее 8 символов.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Пароли не совпадают.");
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.set("email", email.trim());
    formData.set("password", password);
    const result = await registerUser(formData);
    if (result.ok === false) {
      setError(result.error);
      setLoading(false);
      return;
    }
    const signInRes = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      callbackUrl: "/dashboard",
      redirect: false,
    });
    setLoading(false);
    if (signInRes?.error) {
      setError("Аккаунт создан. Если в Supabase включено подтверждение email — проверьте почту, перейдите по ссылке и войдите на странице входа.");
      return;
    }
    if (signInRes?.url) window.location.href = signInRes.url;
  }

  return (
    <Card className="w-full max-w-sm border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-950/30 dark:to-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
          <UserPlus className="h-5 w-5 text-emerald-500" />
          Регистрация
        </CardTitle>
        <CardDescription>
          Создайте аккаунт по email. Пароль — не менее 8 символов.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reg-email">Email</Label>
            <Input
              id="reg-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-password">Пароль</Label>
            <Input
              id="reg-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-confirm">Повторите пароль</Label>
            <Input
              id="reg-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              disabled={loading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Регистрация…" : "Зарегистрироваться"}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="text-primary underline underline-offset-4">
            Войти
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
