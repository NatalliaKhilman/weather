import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id || session.subscription;
    if (!userId) return NextResponse.json({ received: true });

    const subId = session.subscription as string;
    if (!subId) return NextResponse.json({ received: true });

    const subscription = await stripe.subscriptions.retrieve(subId as string);
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

    return NextResponse.json({ received: true });
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata?.userId;
    if (!userId) return NextResponse.json({ received: true });

    if (subscription.status === "active") {
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
    } else {
      await supabase
        .from("user_profiles")
        .update({
          subscription_status: "free",
          subscription_start: null,
          subscription_end: null,
        })
        .eq("id", userId);
    }
    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true });
}
