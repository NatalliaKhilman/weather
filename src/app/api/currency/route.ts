import { NextResponse } from "next/server";
import type { NBRBRate } from "@/types";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const NBRB_URL = "https://www.nbrb.by/api/exrates/rates?periodicity=0";

export async function GET() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(NBRB_URL, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`NBRB API error: ${res.status}`);
    }
    const data: NBRBRate[] = await res.json();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    });
  } catch (e) {
    console.error("Currency fetch failed:", e);
    return NextResponse.json(
      { error: "Failed to fetch exchange rates" },
      { status: 500 }
    );
  }
}
