import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getSession } from "@/lib/session";
import path from "path";
import fs from "fs";

// Fallback Price IDs (same Stripe account as STRIPE_SECRET_KEY). Override via .env.local.
const DEFAULT_STRIPE_MONTHLY_PRICE_ID = "price_1T2DgMRzy0O9kRFUAFVeV2WY";
const DEFAULT_STRIPE_ANNUAL_PRICE_ID = "price_1T2DgNRzy0O9kRFUPGUpBchN";

type PriceIds = {
  monthly?: string;
  annual?: string;
  addonFamily?: string;
  addonApi?: string;
  addonCities?: string;
};

function getStripePriceIds(): PriceIds {
  const out: PriceIds = {};
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    if (!fs.existsSync(envPath)) return out;
    let content = fs.readFileSync(envPath, "utf8");
    content = content.replace(/^\uFEFF/, ""); // BOM
    for (const raw of content.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq <= 0) continue;
      const key = line.slice(0, eq).trim();
      const value = line.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (key === "STRIPE_MONTHLY_PRICE_ID" && value) out.monthly = value;
      if (key === "STRIPE_ANNUAL_PRICE_ID" && value) out.annual = value;
      if (key === "STRIPE_ADDON_FAMILY_PRICE_ID" && value) out.addonFamily = value;
      if (key === "STRIPE_ADDON_API_PRICE_ID" && value) out.addonApi = value;
      if (key === "STRIPE_ADDON_CITIES_PRICE_ID" && value) out.addonCities = value;
    }
  } catch {
    // ignore
  }
  return out;
}

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured");
  return new Stripe(key);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Stripe is not configured. Add STRIPE_SECRET_KEY and price IDs to enable premium subscriptions." },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const plan = body.plan as string;

  const addonPlans = ["family", "api", "cities"] as const;
  const isAddon = addonPlans.includes(plan as (typeof addonPlans)[number]);
  const planType = plan === "annual" ? "annual" : plan === "monthly" ? "monthly" : isAddon ? plan : "monthly";

  let priceId: string | undefined;

  if (isAddon) {
    const envKey =
      plan === "family"
        ? "STRIPE_ADDON_FAMILY_PRICE_ID"
        : plan === "api"
          ? "STRIPE_ADDON_API_PRICE_ID"
          : "STRIPE_ADDON_CITIES_PRICE_ID";
    const fromFile = getStripePriceIds();
    priceId =
      (process.env[envKey] ?? "").trim() ||
      (plan === "family" ? fromFile.addonFamily : plan === "api" ? fromFile.addonApi : fromFile.addonCities);
    if (!priceId) {
      return NextResponse.json(
        {
          error: `Add-on "${plan}" is not configured. Create a Stripe product and set ${envKey} in .env.local. See docs/STRIPE_SETUP.md for add-ons.`,
        },
        { status: 503 }
      );
    }
  } else {
    const fromEnv =
      planType === "annual"
        ? (process.env.STRIPE_ANNUAL_PRICE_ID ?? "").trim()
        : (process.env.STRIPE_MONTHLY_PRICE_ID ?? "").trim();
    const fromFile = getStripePriceIds();
    const fallback =
      planType === "annual"
        ? DEFAULT_STRIPE_ANNUAL_PRICE_ID
        : DEFAULT_STRIPE_MONTHLY_PRICE_ID;
    priceId = fromEnv || (planType === "annual" ? fromFile.annual : fromFile.monthly) || fallback;
  }

  if (!priceId) {
    return NextResponse.json(
      { error: "Stripe price not configured. Set STRIPE_MONTHLY_PRICE_ID and STRIPE_ANNUAL_PRICE_ID in Stripe Dashboard (Products → Prices)." },
      { status: 503 }
    );
  }

  try {
    const stripe = getStripe();
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXTAUTH_URL}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing`,
      customer_email: session.user.email!,
      client_reference_id: (session as any).user.id,
      subscription_data: {
        metadata: { userId: (session as any).user.id, planType: String(planType) },
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Checkout creation failed" },
      { status: 500 }
    );
  }
}
