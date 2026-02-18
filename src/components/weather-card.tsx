"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Loader2, MapPin, Navigation } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { OpenWeatherCurrent, OpenWeatherForecastItem } from "@/types";

const ICON_URL = "https://openweathermap.org/img/wn";

function iconSrc(icon: string | undefined, size2x = false): string {
  if (!icon) return "";
  if (icon.startsWith("http") || icon.startsWith("//")) {
    return icon.startsWith("//") ? `https:${icon}` : icon;
  }
  return `${ICON_URL}/${icon}${size2x ? "@2x" : ""}.png`;
}

type WeatherData = {
  current: OpenWeatherCurrent;
  forecast: OpenWeatherForecastItem[] | null;
};

export function WeatherCard({ isPremium }: { isPremium: boolean }) {
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchWeather = useCallback(
    async (params: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/weather?${params}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Не удалось загрузить погоду");
          setWeather(null);
          return;
        }
        const forecastList = data.forecast?.list ?? [];
        const dailyMap = new Map<string, OpenWeatherForecastItem>();
        forecastList.forEach((item: OpenWeatherForecastItem) => {
          const day = item.dt_txt.slice(0, 10);
          if (!dailyMap.has(day)) dailyMap.set(day, item);
        });
        const daily = Array.from(dailyMap.values()).slice(0, isPremium ? 7 : 5);
        setWeather({
          current: data.current,
          forecast: daily.length ? daily : null,
        });
      } catch {
        setError("Ошибка сети");
        setWeather(null);
        toast({ title: "Ошибка", description: "Не удалось получить погоду", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    },
    [isPremium, toast]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = city.trim();
    if (!trimmed) return;
    fetchWeather(`city=${encodeURIComponent(trimmed)}`);
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "Не поддерживается", description: "Геолокация недоступна.", variant: "destructive" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeather(`lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`),
      () => {
        toast({ title: "Доступ к геолокации запрещён", description: "Разрешите доступ к местоположению.", variant: "destructive" });
      }
    );
  };

  return (
    <Card className="card-weather">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sky-700 dark:text-sky-300">
          <MapPin className="h-5 w-5 text-sky-500" />
          Погода
        </CardTitle>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1 space-y-1">
            <Label htmlFor="city" className="sr-only">Город</Label>
            <Input
              id="city"
              placeholder="Название города"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={loading}
              className="border-sky-200 focus-visible:ring-sky-500 dark:border-sky-800"
            />
          </div>
          <Button type="submit" disabled={loading} className="bg-sky-500 hover:bg-sky-600 text-white">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Поиск"}
          </Button>
          <Button type="button" variant="outline" onClick={handleGeolocation} disabled={loading} className="border-sky-300 text-sky-600 hover:bg-sky-50 dark:border-sky-700 dark:text-sky-400 dark:hover:bg-sky-950/50">
            <Navigation className="h-4 w-4 text-sky-500" />
          </Button>
        </form>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        {weather && (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-3xl font-bold text-sky-700 dark:text-sky-200">{Math.round(weather.current.main.temp)}°C</p>
                <p className="text-muted-foreground">
                  {weather.current.weather[0]?.description ?? ""}
                </p>
                <p className="text-sm text-muted-foreground">
                  Ощущается {Math.round(weather.current.main.feels_like)}°C · {weather.current.name}
                </p>
              </div>
              {weather.current.weather[0]?.icon && (
                <Image
                  src={iconSrc(weather.current.weather[0].icon, true)}
                  alt=""
                  width={64}
                  height={64}
                  unoptimized
                />
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-sky-600 dark:text-sky-400">Влажность: {weather.current.main.humidity}%</span>
              <span className="text-sky-600 dark:text-sky-400">Ветер: {weather.current.wind.speed} м/с</span>
              <span className="text-sky-600 dark:text-sky-400">Давление: {weather.current.main.pressure} гПа</span>
            </div>
            {weather.forecast && weather.forecast.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium">
                  Прогноз на {isPremium ? "7" : "5"} дней
                </p>
                <div className="flex flex-wrap gap-2">
                  {weather.forecast.map((day) => (
                    <div
                      key={day.dt}
                      className="rounded-md border border-sky-200 bg-sky-50/80 dark:border-sky-800 dark:bg-sky-950/40 px-3 py-2 text-center text-sm"
                    >
                      <p className="font-medium">
                        {new Date(day.dt_txt).toLocaleDateString("ru-RU", { weekday: "short" })}
                      </p>
                      <p>{Math.round(day.main.temp)}°C</p>
                      {day.weather[0]?.icon && (
                        <Image
                          src={iconSrc(day.weather[0].icon)}
                          alt=""
                          width={32}
                          height={32}
                          className="mx-auto"
                          unoptimized
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        {!weather && !loading && !error && (
          <p className="text-sm text-muted-foreground">
            Введите город или нажмите кнопку геолокации, чтобы увидеть погоду.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
