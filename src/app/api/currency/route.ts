import { NextResponse } from "next/server";
import type { NBRBRate } from "@/types";

const NBRB_URL = "https://www.nbrb.by/api/exrates/rates?periodicity=0";

export async function GET() {
  try {
    const res = await fetch(NBRB_URL, { next: { revalidate: 3600 } });
    if (!res.ok) {
      throw new Error(`NBRB API error: ${res.status}`);
    }
    const data: NBRBRate[] = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to fetch exchange rates" },
      { status: 500 }
    );
  }
}
