import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getStripe } from "@/lib/stripe";

const DEFAULT_STRIPE_MONTHLY_PRICE_ID = "price_1T2DgMRzy0O9kRFUAFVeV2WY";
const DEFAULT_STRIPE_ANNUAL_PRICE_ID = "price_1T2DgNRzy0O9kRFUPGUpBchN";

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
    priceId = (process.env[envKey] ?? "").trim() || undefined;
    if (!priceId) {
      return NextResponse.json(
        { error: `Add-on "${plan}" is not configured. Set ${envKey} in environment variables.` },
        { status: 503 }
      );
    }
  } else {
    priceId =
      (planType === "annual"
        ? (process.env.STRIPE_ANNUAL_PRICE_ID ?? "").trim()
        : (process.env.STRIPE_MONTHLY_PRICE_ID ?? "").trim()) ||
      (planType === "annual" ? DEFAULT_STRIPE_ANNUAL_PRICE_ID : DEFAULT_STRIPE_MONTHLY_PRICE_ID);
  }

  if (!priceId) {
    return NextResponse.json(
      { error: "Stripe price not configured. Set STRIPE_MONTHLY_PRICE_ID and STRIPE_ANNUAL_PRICE_ID in Stripe Dashboard (Products → Prices)." },
      { status: 503 }
    );
  }

  try {
    const stripe = getStripe();
    const origin = request.headers.get("origin") || process.env.NEXTAUTH_URL || "https://weather-gamma-orpin.vercel.app";
    const userId = (session as any).user?.id || "unknown";
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
      customer_email: session.user.email!,
      client_reference_id: userId,
      subscription_data: {
        metadata: { userId, planType: String(planType) },
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (e: any) {
    console.error("Stripe checkout error:", e);
    const message = e?.message || "Checkout creation failed";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
