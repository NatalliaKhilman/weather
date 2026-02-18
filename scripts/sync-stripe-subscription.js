#!/usr/bin/env node
/**
 * Sync Stripe subscription status to Supabase for a given email.
 * Usage: node scripts/sync-stripe-subscription.js <email>
 */

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const envPath = path.join(root, ".env.local");

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
  }
}

const email = (process.argv[2] || "").trim().toLowerCase();
if (!email) {
  console.error("Usage: node scripts/sync-stripe-subscription.js <email>");
  process.exit(1);
}

const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  console.error("STRIPE_SECRET_KEY not set");
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase credentials not set");
  process.exit(1);
}

async function main() {
  const Stripe = (await import("stripe")).default;
  const { createClient } = await import("@supabase/supabase-js");

  const stripe = new Stripe(stripeKey);
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log(`Looking up Stripe customer: ${email}`);
  const customers = await stripe.customers.list({ email, limit: 5 });

  if (customers.data.length === 0) {
    console.log("No Stripe customer found for this email.");
    console.log("Checking checkout sessions by customer_email...");

    const sessions = await stripe.checkout.sessions.list({ limit: 100 });
    const match = sessions.data.find(
      (s) => s.customer_email?.toLowerCase() === email && s.payment_status === "paid"
    );

    if (!match) {
      console.log("No paid checkout session found for this email.");
      process.exit(0);
    }

    console.log(`Found paid checkout session: ${match.id}`);
    const userId = match.client_reference_id;
    const subId = match.subscription;

    if (subId) {
      const sub = await stripe.subscriptions.retrieve(subId);
      const start = new Date(sub.current_period_start * 1000).toISOString();
      const end = new Date(sub.current_period_end * 1000).toISOString();
      console.log(`Subscription: ${sub.id}, status: ${sub.status}, period: ${start} — ${end}`);

      if (sub.status === "active" || sub.status === "trialing") {
        const query = userId
          ? supabase.from("user_profiles").update({ subscription_status: "premium", subscription_start: start, subscription_end: end }).eq("id", userId)
          : supabase.from("user_profiles").update({ subscription_status: "premium", subscription_start: start, subscription_end: end }).eq("email", email);

        const { data, error } = await query.select("id, email, subscription_status, subscription_start, subscription_end");
        if (error) {
          console.error("DB update error:", error.message);
          process.exit(1);
        }
        console.log("Updated:", data);
      } else {
        console.log(`Subscription not active (status: ${sub.status}), skipping.`);
      }
    } else {
      console.log("No subscription ID in checkout session.");
    }
    return;
  }

  for (const customer of customers.data) {
    console.log(`\nCustomer: ${customer.id} (${customer.email})`);
    const subs = await stripe.subscriptions.list({ customer: customer.id, status: "all", limit: 10 });

    if (subs.data.length === 0) {
      console.log("  No subscriptions found.");
      continue;
    }

    for (const sub of subs.data) {
      const start = new Date(sub.current_period_start * 1000).toISOString();
      const end = new Date(sub.current_period_end * 1000).toISOString();
      console.log(`  Subscription: ${sub.id}, status: ${sub.status}, period: ${start} — ${end}`);

      if (sub.status === "active" || sub.status === "trialing") {
        const userId = sub.metadata?.userId;
        const query = userId
          ? supabase.from("user_profiles").update({ subscription_status: "premium", subscription_start: start, subscription_end: end }).eq("id", userId)
          : supabase.from("user_profiles").update({ subscription_status: "premium", subscription_start: start, subscription_end: end }).eq("email", email);

        const { data, error } = await query.select("id, email, subscription_status, subscription_start, subscription_end");
        if (error) {
          console.error("  DB update error:", error.message);
        } else {
          console.log("  Updated:", data);
        }
      }
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
