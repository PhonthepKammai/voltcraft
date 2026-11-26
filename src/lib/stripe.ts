import Stripe from "stripe";

const g = globalThis as unknown as { _stripe?: Stripe };

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY environment variable.");
  return (g._stripe ??= new Stripe(key));
}
