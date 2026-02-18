"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Check, Loader2, Crown, Users, Database, MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PREMIUM_FEATURES } from "@/lib/subscription";
type PlanType = "monthly" | "annual";
type AddonType = "family" | "api" | "cities";

export default function PricingPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState<PlanType | AddonType | null>(null);
  const { toast } = useToast();

  const handleCheckout = async (plan: PlanType | AddonType) => {
    if (!session) {
      toast({ title: "Требуется вход", description: "Войдите, чтобы оформить подписку.", variant: "destructive" });
      return;
    }
    setLoading(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка оформления");
      if (data.url) window.location.href = data.url;
      else throw new Error("Нет ссылки на оплату");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка оформления";
      toast({ title: "Ошибка", description: msg, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-5xl space-y-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 via-amber-500 to-emerald-500 bg-clip-text text-transparent dark:from-amber-400 dark:via-amber-300 dark:to-emerald-400">Тарифы</h1>
          <p className="text-muted-foreground mt-2">
            Выберите подходящий план. Премиум — расширенный прогноз и дополнительные возможности.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/50 dark:to-card">
            <CardHeader>
              <CardTitle className="text-slate-700 dark:text-slate-200">Бесплатный</CardTitle>
              <CardDescription>Базовый доступ</CardDescription>
              <p className="text-2xl font-bold mt-2 text-slate-800 dark:text-slate-100">Бесплатно</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Текущая погода</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Прогноз на 5 дней</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Курсы валют и конвертер</li>
              </ul>
              {!session ? (
                <Button asChild className="w-full">
                  <Link href="/login">Войти</Link>
                </Button>
              ) : (
                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard">В панель</Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="border-amber-400 dark:border-amber-600 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/50 dark:to-amber-900/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                <CardTitle className="text-amber-800 dark:text-amber-200">Премиум</CardTitle>
              </div>
              <CardDescription>Расширенный прогноз и больше возможностей</CardDescription>
              <p className="text-2xl font-bold mt-2 text-amber-800 dark:text-amber-200">
                <span className="text-muted-foreground line-through text-lg">$9.99</span> $4.99<span className="text-sm font-normal text-muted-foreground">/мес</span>
              </p>
              <p className="text-xs text-muted-foreground">или $49/год (экономия 17%)</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm">
                {PREMIUM_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
                disabled={status === "loading" || loading !== null}
                onClick={() => handleCheckout("monthly")}
              >
                {loading === "monthly" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Подписка помесячно"}
              </Button>
              <Button
                variant="outline"
                className="w-full border-amber-400 text-amber-700 hover:bg-amber-50 dark:border-amber-500 dark:text-amber-400 dark:hover:bg-amber-950/50"
                disabled={status === "loading" || loading !== null}
                onClick={() => handleCheckout("annual")}
              >
                {loading === "annual" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Подписка на год"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4 text-slate-700 dark:text-slate-200">Дополнительные опции для Премиум</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Расширьте подписку Премиум опциональными дополнениями. Нужна активная подписка Премиум.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-dashed border-sky-300 dark:border-sky-700 bg-sky-50/50 dark:bg-sky-950/30">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-sky-500" />
                  <CardTitle className="text-base text-sky-700 dark:text-sky-300">Семейный доступ</CardTitle>
                </div>
                <CardDescription>До 5 членов семьи с доступом к Премиум</CardDescription>
                <p className="text-lg font-bold mt-2">+$2.99<span className="text-sm font-normal text-muted-foreground">/мес</span></p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-xs text-muted-foreground mb-4">
                  <li>• Отдельный профиль для каждого</li>
                  <li>• Общие сохранённые города</li>
                </ul>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={status === "loading" || loading !== null}
                  onClick={() => handleCheckout("family")}
                >
                  {loading === "family" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Добавить семью"}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-dashed border-violet-300 dark:border-violet-700 bg-violet-50/50 dark:bg-violet-950/30">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-violet-500" />
                  <CardTitle className="text-base text-violet-700 dark:text-violet-300">Доступ к API</CardTitle>
                </div>
                <CardDescription>REST API для погоды и валют</CardDescription>
                <p className="text-lg font-bold mt-2">+$9.99<span className="text-sm font-normal text-muted-foreground">/мес</span></p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-xs text-muted-foreground mb-4">
                  <li>• 10 000 запросов/месяц</li>
                  <li>• API-ключ включён</li>
                </ul>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={status === "loading" || loading !== null}
                  onClick={() => handleCheckout("api")}
                >
                  {loading === "api" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Добавить API"}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-dashed border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/30">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-emerald-500" />
                  <CardTitle className="text-base text-emerald-700 dark:text-emerald-300">Доп. города</CardTitle>
                </div>
                <CardDescription>+20 сохранённых городов (всего 30)</CardDescription>
                <p className="text-lg font-bold mt-2">+$1.99<span className="text-sm font-normal text-muted-foreground">/мес</span></p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-xs text-muted-foreground mb-4">
                  <li>• До 30 сохранённых городов</li>
                </ul>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={status === "loading" || loading !== null}
                  onClick={() => handleCheckout("cities")}
                >
                  {loading === "cities" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Добавить города"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
