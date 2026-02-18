import Link from "next/link";
import { getSession } from "@/lib/session";
import { Cloud, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SetupCard } from "@/components/setup-card";

export default async function HomePage() {
  let session = null;
  try {
    session = await getSession();
  } catch {
    // Auth not configured or error — show home without session
  }

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-2xl space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-sky-600 via-sky-500 to-emerald-500 bg-clip-text text-transparent dark:from-sky-400 dark:via-sky-300 dark:to-emerald-400">
            Погода и валюты
          </h1>
          <p className="mt-2 text-muted-foreground">
            Погода в реальном времени, курсы НБРБ и премиум-функции.
          </p>
        </div>

        {session ? (
          <Button asChild size="lg" className="bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white">
            <Link href="/dashboard">Перейти в панель</Link>
          </Button>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white">
              <Link href="/login">Войти</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-amber-400 text-amber-700 hover:bg-amber-50 dark:border-amber-500 dark:text-amber-400 dark:hover:bg-amber-950/50">
              <Link href="/pricing">Тарифы</Link>
            </Button>
          </div>
        )}

        <SetupCard />

        <div className="grid gap-4 sm:grid-cols-2 pt-8">
          <Card className="card-weather border-sky-200 dark:border-sky-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sky-700 dark:text-sky-300">
                <Cloud className="h-5 w-5 text-sky-500" />
                Погода
              </CardTitle>
              <CardDescription>Текущая погода и прогноз на 5–7 дней</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Поиск по городу или геолокация. Температура, влажность, ветер, давление.
              </p>
            </CardContent>
          </Card>
          <Card className="card-currency border-emerald-200 dark:border-emerald-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <Coins className="h-5 w-5 text-emerald-500" />
                Валюты
              </CardTitle>
              <CardDescription>Официальные курсы НБРБ к BYN</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                USD, EUR, RUB, PLN и другие. Встроенный конвертер.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
