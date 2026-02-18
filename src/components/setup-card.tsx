import { Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SetupCard() {
  return (
    <Card className="text-left card-setup">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-violet-700 dark:text-violet-300">
          <Zap className="h-5 w-5 text-violet-500" />
          Быстрый старт
        </CardTitle>
        <CardDescription>
          Настройте .env.local: ключи OpenWeatherMap, Supabase, Google OAuth, Stripe для работы панели.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Список переменных — в файле .env.example в корне проекта.
        </p>
      </CardContent>
    </Card>
  );
}
