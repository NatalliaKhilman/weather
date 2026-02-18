import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { session_id } = await request.json().catch(() => ({} as any));
  if (!session_id || typeof session_id !== "string") {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const checkoutSession = await stripe.checkout.sessions.retrieve(session_id);

    if (checkoutSession.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }

    const userId = checkoutSession.client_reference_id;
    if (!userId || userId !== (session as any).user.id) {
      return NextResponse.json({ error: "Session mismatch" }, { status: 403 });
    }

    const subId = checkoutSession.subscription as string;
    if (!subId) {
      return NextResponse.json({ error: "No subscription found" }, { status: 400 });
    }

    const subscription = await stripe.subscriptions.retrieve(subId);
    const start = new Date(subscription.current_period_start * 1000).toISOString();
    const end = new Date(subscription.current_period_end * 1000).toISOString();

    await supabase
      .from("user_profiles")
      .update({
        subscription_status: "premium",
        subscription_start: start,
        subscription_end: end,
      })
      .eq("id", userId);

    return NextResponse.json({ status: "premium", subscription_start: start, subscription_end: end });
  } catch (e: any) {
    console.error("Stripe verify error:", e);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
