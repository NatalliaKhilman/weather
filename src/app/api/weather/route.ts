import { NextRequest } from "next/server";
import type { OpenWeatherCurrent, OpenWeatherForecast, OpenWeatherForecastItem, HourlyForecastItem, WeatherAlert } from "@/types";

const WEATHERAPI_BASE = "https://api.weatherapi.com/v1";
const API_KEY = process.env.WEATHERAPI_API_KEY;

function toOWIcon(icon: string): string {
  if (!icon) return "01d";
  if (icon.startsWith("http")) return icon;
  return icon.startsWith("//") ? `https:${icon}` : icon;
}

function toOWCondition(code: number, text: string) {
  return {
    id: code,
    main: text.split(/[\s,]/)[0] || "Unknown",
    description: text,
    icon: "",
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!API_KEY) {
    return Response.json(
      { error: "WeatherAPI key not configured" },
      { status: 500 }
    );
  }

  let q: string;
  if (city && city.trim()) {
    q = encodeURIComponent(city.trim());
  } else if (lat != null && lon != null) {
    q = `${lat},${lon}`;
  } else {
    return Response.json(
      { error: "Provide city or lat/lon" },
      { status: 400 }
    );
  }

  const forecastUrl = `${WEATHERAPI_BASE}/forecast.json?key=${API_KEY}&q=${q}&days=7&lang=ru&alerts=yes`;

  try {
    const res = await fetch(forecastUrl);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return Response.json(
        { error: err?.error?.message || "Weather fetch failed" },
        { status: res.status }
      );
    }

    const data = await res.json();
    const loc = data.location ?? {};
    const cur = data.current ?? {};
    const cond = cur.condition ?? {};

    const current: OpenWeatherCurrent = {
      main: {
        temp: cur.temp_c ?? 0,
        feels_like: cur.feelslike_c ?? cur.temp_c ?? 0,
        humidity: cur.humidity ?? 0,
        pressure: cur.pressure_mb ?? 0,
      },
      wind: { speed: (cur.wind_kph ?? 0) / 3.6 },
      weather: [
        {
          ...toOWCondition(cond.code ?? 1000, cond.text ?? "Unknown"),
          icon: toOWIcon(cond.icon ?? ""),
        },
      ],
      name: loc.name ?? "Unknown",
    };

    const forecastday = data.forecast?.forecastday ?? [];
    const list: OpenWeatherForecastItem[] = forecastday.map((fd: { date: string; date_epoch: number; day: { avgtemp_c: number; condition: { code: number; text: string; icon: string } } }) => ({
      dt: fd.date_epoch ?? new Date(fd.date).getTime() / 1000,
      main: { temp: fd.day?.avgtemp_c ?? 0 },
      weather: [
        {
          ...toOWCondition(
            fd.day?.condition?.code ?? 1000,
            fd.day?.condition?.text ?? "Unknown"
          ),
          icon: toOWIcon(fd.day?.condition?.icon ?? ""),
        },
      ],
      dt_txt: `${fd.date} 12:00:00`,
    }));

    const forecast: OpenWeatherForecast = {
      list,
      city: { name: loc.name ?? "Unknown" },
    };

    const nowEpoch = Math.floor(Date.now() / 1000);
    const allHours: HourlyForecastItem[] = [];
    for (const fd of forecastday) {
      for (const h of fd.hour ?? []) {
        if (h.time_epoch >= nowEpoch && allHours.length < 24) {
          const hCond = h.condition ?? {};
          allHours.push({
            dt: h.time_epoch,
            time: h.time,
            temp: h.temp_c ?? 0,
            feels_like: h.feelslike_c ?? 0,
            humidity: h.humidity ?? 0,
            wind_speed: Math.round(((h.wind_kph ?? 0) / 3.6) * 10) / 10,
            weather: {
              ...toOWCondition(hCond.code ?? 1000, hCond.text ?? "Unknown"),
              icon: toOWIcon(hCond.icon ?? ""),
            },
          });
        }
      }
    }

    const rawAlerts = data.alerts?.alert ?? [];
    const alerts: WeatherAlert[] = rawAlerts.map((a: Record<string, string>) => ({
      headline: a.headline ?? a.event ?? "Предупреждение",
      severity: a.severity ?? "Unknown",
      event: a.event ?? "",
      desc: a.desc ?? "",
      effective: a.effective ?? "",
      expires: a.expires ?? "",
    }));

    return Response.json({ current, forecast, hourly: allHours, alerts });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: "Weather service error" },
      { status: 500 }
    );
  }
}
