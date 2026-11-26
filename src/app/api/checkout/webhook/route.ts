import { NextRequest } from "next/server";
import type Stripe from "stripe";
import { fail, handle, ok } from "@/lib/api";
import { getStripe } from "@/lib/stripe";
import { confirmStripePayment } from "@/services/order.service";

export const runtime = "nodejs"; // Stripe signature check needs the raw body + Node crypto

export const POST = handle(async (req: NextRequest) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get("stripe-signature");
  if (!secret || !sig) return fail("Missing webhook signature", 400);

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await req.text(), sig, secret);
  } catch {
    return fail("Invalid signature", 400);
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    await confirmStripePayment((event.data.object as Stripe.Checkout.Session).id);
  }
  return ok({ received: true });
});
