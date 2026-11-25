import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { AppError, handleApiError, ok } from '@/lib/errors';
import { getStripe } from '@/lib/stripe';
import { confirmStripePayment } from '@/services/order.service';

export async function POST(req: NextRequest) {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new AppError('Missing STRIPE_WEBHOOK_SECRET configuration', 500);
    }

    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      throw new AppError('Missing Stripe signature header', 400);
    }

    const rawBody = await req.text();
    const stripe = getStripe();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid webhook signature';
      throw new AppError(`Webhook verification failed: ${message}`, 400);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status === 'paid') {
        await confirmStripePayment(session.id);
      }
    }

    return ok({ received: true });
  } catch (error) {
    return handleApiError(error);
  }
}