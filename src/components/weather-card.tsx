"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { Loader2, MapPin, Navigation, AlertTriangle, Star, StarOff, Download, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { OpenWeatherCurrent, OpenWeatherForecastItem, HourlyForecastItem, WeatherAlert } from "@/types";

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
  hourly: HourlyForecastItem[] | null;
  alerts: WeatherAlert[];
};

const SAVED_CITIES_KEY = "weather_saved_cities";
const MAX_SAVED_CITIES = 10;

function getSavedCities(): string[] {
  try {
    const raw = localStorage.getItem(SAVED_CITIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setSavedCities(cities: string[]) {
  localStorage.setItem(SAVED_CITIES_KEY, JSON.stringify(cities));
}

function exportCSV(weather: WeatherData) {
  const rows: string[][] = [
    ["Параметр", "Значение"],
    ["Город", weather.current.name],
    ["Температура (°C)", String(Math.round(weather.current.main.temp))],
    ["Ощущается (°C)", String(Math.round(weather.current.main.feels_like))],
    ["Влажность (%)", String(weather.current.main.humidity)],
    ["Ветер (м/с)", String(weather.current.wind.speed)],
    ["Давление (гПа)", String(weather.current.main.pressure)],
    ["Описание", weather.current.weather[0]?.description ?? ""],
  ];
  if (weather.forecast) {
    rows.push([], ["Прогноз"]);
    rows.push(["Дата", "Температура (°C)", "Описание"]);
    weather.forecast.forEach((d) => {
      rows.push([
        new Date(d.dt_txt).toLocaleDateString("ru-RU"),
        String(Math.round(d.main.temp)),
        d.weather[0]?.description ?? "",
      ]);
    });
  }
  if (weather.hourly && weather.hourly.length > 0) {
    rows.push([], ["Почасовой прогноз"]);
    rows.push(["Время", "Температура (°C)", "Влажность (%)", "Ветер (м/с)"]);
    weather.hourly.forEach((h) => {
      rows.push([
        new Date(h.dt * 1000).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
        String(Math.round(h.temp)),
        String(h.humidity),
        String(h.wind_speed),
      ]);
    });
  }
  const bom = "\uFEFF";
  const csv = bom + rows.map((r) => r.map((c) => `"${c}"`).join(";")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pogoda_${weather.current.name}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportPDF(weather: WeatherData) {
  const w = window.open("", "_blank");
  if (!w) return;

  let forecastHtml = "";
  if (weather.forecast) {
    forecastHtml = `<h2>Прогноз</h2><table><tr><th>Дата</th><th>Температура</th><th>Описание</th></tr>`;
    weather.forecast.forEach((d) => {
      forecastHtml += `<tr><td>${new Date(d.dt_txt).toLocaleDateString("ru-RU")}</td><td>${Math.round(d.main.temp)}°C</td><td>${d.weather[0]?.description ?? ""}</td></tr>`;
    });
    forecastHtml += `</table>`;
  }

  let hourlyHtml = "";
  if (weather.hourly && weather.hourly.length > 0) {
    hourlyHtml = `<h2>Почасовой прогноз</h2><table><tr><th>Время</th><th>Темп.</th><th>Влажн.</th><th>Ветер</th></tr>`;
    weather.hourly.forEach((h) => {
      hourlyHtml += `<tr><td>${new Date(h.dt * 1000).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</td><td>${Math.round(h.temp)}°C</td><td>${h.humidity}%</td><td>${h.wind_speed} м/с</td></tr>`;
    });
    hourlyHtml += `</table>`;
  }

  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Погода — ${weather.current.name}</title>
<style>body{font-family:system-ui,sans-serif;padding:2rem;color:#1e293b}h1{color:#0369a1}h2{color:#0e7490;margin-top:1.5rem}
table{border-collapse:collapse;width:100%;margin:.5rem 0}th,td{border:1px solid #cbd5e1;padding:6px 10px;text-align:left}
th{background:#f0f9ff;font-weight:600}.meta{color:#64748b;font-size:.9rem}
@media print{body{padding:0}}</style></head><body>
<h1>Погода — ${weather.current.name}</h1>
<p class="meta">Дата отчёта: ${new Date().toLocaleString("ru-RU")}</p>
<table>
<tr><th>Параметр</th><th>Значение</th></tr>
<tr><td>Температура</td><td>${Math.round(weather.current.main.temp)}°C</td></tr>
<tr><td>Ощущается</td><td>${Math.round(weather.current.main.feels_like)}°C</td></tr>
<tr><td>Влажность</td><td>${weather.current.main.humidity}%</td></tr>
<tr><td>Ветер</td><td>${weather.current.wind.speed} м/с</td></tr>
<tr><td>Давление</td><td>${weather.current.main.pressure} гПа</td></tr>
<tr><td>Описание</td><td>${weather.current.weather[0]?.description ?? ""}</td></tr>
</table>
${forecastHtml}${hourlyHtml}
</body></html>`);
  w.document.close();
  setTimeout(() => w.print(), 300);
}

export function WeatherCard({ isPremium }: { isPremium: boolean }) {
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedCities, setSavedCitiesState] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (isPremium) setSavedCitiesState(getSavedCities());
  }, [isPremium]);

  const toggleSaveCity = (name: string) => {
    const current = getSavedCities();
    let updated: string[];
    if (current.includes(name)) {
      updated = current.filter((c) => c !== name);
    } else {
      if (current.length >= MAX_SAVED_CITIES) {
        toast({ title: "Лимит", description: `Максимум ${MAX_SAVED_CITIES} сохранённых городов.`, variant: "destructive" });
        return;
      }
      updated = [...current, name];
    }
    setSavedCities(updated);
    setSavedCitiesState(updated);
  };

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
        const hourlyData: HourlyForecastItem[] = data.hourly ?? [];
        const alertsData: WeatherAlert[] = isPremium ? (data.alerts ?? []) : [];
        setWeather({
          current: data.current,
          forecast: daily.length ? daily : null,
          hourly: isPremium && hourlyData.length ? hourlyData : null,
          alerts: alertsData,
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
        {isPremium && savedCities.length > 0 && (
          <div className="flex gap-1.5 flex-wrap pt-1">
            {savedCities.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setCity(c);
                  fetchWeather(`city=${encodeURIComponent(c)}`);
                }}
                className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50/60 dark:border-amber-800 dark:bg-amber-950/30 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
              >
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {c}
              </button>
            ))}
          </div>
        )}
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
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Ощущается {Math.round(weather.current.main.feels_like)}°C · {weather.current.name}</span>
                  {isPremium && (
                    <button
                      onClick={() => toggleSaveCity(weather.current.name)}
                      className="text-amber-500 hover:text-amber-600 transition-colors"
                      title={savedCities.includes(weather.current.name) ? "Убрать из сохранённых" : "Сохранить город"}
                    >
                      {savedCities.includes(weather.current.name) ? (
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ) : (
                        <StarOff className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {weather.current.weather[0]?.icon && (
                  <Image
                    src={iconSrc(weather.current.weather[0].icon, true)}
                    alt=""
                    width={64}
                    height={64}
                    unoptimized
                  />
                )}
                {isPremium && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => exportCSV(weather)}
                      className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                      title="Экспорт в CSV"
                    >
                      <Download className="h-3 w-3" /> CSV
                    </button>
                    <button
                      onClick={() => exportPDF(weather)}
                      className="inline-flex items-center gap-1 rounded border border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/40 px-2 py-0.5 text-[10px] font-medium text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
                      title="Экспорт в PDF"
                    >
                      <FileText className="h-3 w-3" /> PDF
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-sky-600 dark:text-sky-400">Влажность: {weather.current.main.humidity}%</span>
              <span className="text-sky-600 dark:text-sky-400">Ветер: {weather.current.wind.speed} м/с</span>
              <span className="text-sky-600 dark:text-sky-400">Давление: {weather.current.main.pressure} гПа</span>
            </div>
            {weather.alerts.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center gap-1.5 text-red-600 dark:text-red-400">
                  <AlertTriangle className="h-4 w-4" />
                  Оповещения о погоде
                </p>
                {weather.alerts.map((alert, i) => (
                  <div
                    key={i}
                    className="rounded-md border border-red-200 bg-red-50/80 dark:border-red-800 dark:bg-red-950/30 px-3 py-2 text-sm"
                  >
                    <p className="font-medium text-red-700 dark:text-red-300">{alert.headline || alert.event}</p>
                    {alert.desc && (
                      <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-1 line-clamp-3">{alert.desc}</p>
                    )}
                    {alert.expires && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Действует до: {new Date(alert.expires).toLocaleString("ru-RU")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
            {weather.hourly && weather.hourly.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
                  Почасовой прогноз (24 ч)
                </p>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                  {weather.hourly.map((h) => {
                    const hour = new Date(h.dt * 1000).toLocaleTimeString("ru-RU", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    return (
                      <div
                        key={h.dt}
                        className="flex flex-col items-center rounded-md border border-amber-200 bg-amber-50/60 dark:border-amber-800 dark:bg-amber-950/30 px-3 py-2 text-center text-xs shrink-0 min-w-[68px]"
                      >
                        <p className="font-medium text-amber-700 dark:text-amber-300">{hour}</p>
                        {h.weather.icon && (
                          <Image
                            src={iconSrc(h.weather.icon)}
                            alt=""
                            width={28}
                            height={28}
                            className="my-0.5"
                            unoptimized
                          />
                        )}
                        <p className="font-semibold">{Math.round(h.temp)}°</p>
                        <p className="text-muted-foreground">{h.wind_speed} м/с</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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
