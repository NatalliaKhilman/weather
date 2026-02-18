import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured");
  if (!stripeInstance) {
    stripeInstance = new Stripe(key, {
      maxNetworkRetries: 3,
      timeout: 30000,
      httpClient: Stripe.createFetchHttpClient(),
    });
  }
  return stripeInstance;
}
