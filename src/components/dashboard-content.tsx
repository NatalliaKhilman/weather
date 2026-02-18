"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Check, Crown, Headphones } from "lucide-react";
import { WeatherCard } from "@/components/weather-card";
import { CurrencySection } from "@/components/currency-section";
import { AdBanner } from "@/components/ad-banner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { isPremium, PREMIUM_FEATURES } from "@/lib/subscription";

export function DashboardContent() {
  const { data: session } = useSession();
  const isPremiumUser = session?.user ? isPremium((session as any).user) : false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent dark:from-sky-400 dark:to-emerald-400">Дашборд</h1>
        {session?.user?.email && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{session.user.email}</span>
            {isPremiumUser && <Badge variant="success">Премиум</Badge>}
          </div>
        )}
      </div>

      {!isPremiumUser && <AdBanner />}

      <div className="grid gap-6 lg:grid-cols-1 xl:grid-cols-2">
        <WeatherCard isPremium={isPremiumUser} />
        <CurrencySection />
      </div>

      {isPremiumUser ? (
        <>
          <Card className="border-amber-300 dark:border-amber-700 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/50 dark:to-amber-900/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                <CardTitle className="text-base text-amber-800 dark:text-amber-200">Ваши преимущества Premium</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2 text-sm sm:grid-cols-2">
                {PREMIUM_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-violet-300 dark:border-violet-700 bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-950/50 dark:to-violet-900/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Headphones className="h-5 w-5 text-violet-500" />
                <CardTitle className="text-base text-violet-800 dark:text-violet-200">Приоритетная поддержка</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Как пользователь Премиум, вы имеете приоритетную поддержку с ускоренным временем ответа.
              </p>
              <div className="grid gap-2 sm:grid-cols-2 text-sm">
                <div className="rounded-md border border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/30 px-3 py-2">
                  <p className="font-medium text-violet-700 dark:text-violet-300">Email поддержки</p>
                  <a href="mailto:premium-support@weather.app" className="text-violet-600 dark:text-violet-400 underline hover:text-violet-700">
                    premium-support@weather.app
                  </a>
                </div>
                <div className="rounded-md border border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/30 px-3 py-2">
                  <p className="font-medium text-violet-700 dark:text-violet-300">Время ответа</p>
                  <p className="text-violet-600 dark:text-violet-400">До 4 часов (рабочие дни)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="border-amber-400/60 dark:border-amber-600/60 bg-gradient-to-br from-amber-50 to-amber-100/30 dark:from-amber-950/40 dark:to-amber-900/20">
          <CardHeader>
            <CardTitle className="text-base text-amber-800 dark:text-amber-200">Только для Премиум</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              {PREMIUM_FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-amber-500" />
                  {feature}
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted-foreground">
              Дополнительно: семейный доступ, API, больше городов.{" "}
              <Link href="/pricing" className="font-medium text-amber-600 dark:text-amber-400 underline hover:text-amber-700">
                Перейти на Премиум
              </Link>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
