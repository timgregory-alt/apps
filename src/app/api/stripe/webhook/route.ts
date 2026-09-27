import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/server";
import { getStripeClient, isActiveSubscriptionStatus, isStripeConfigured } from "@/lib/stripe";

export const runtime = "nodejs";

/** Stripe sends events for a customer/subscription — profiles are looked up
 * by stripe_customer_id, which is set when checkout starts. An event for a
 * customer we don't recognize (e.g. a duplicate/retried delivery after the
 * profile was deleted) is logged and skipped rather than erroring, since
 * there's nothing to update. */
async function syncSubscriptionStatus(subscription: Stripe.Subscription) {
  const supabase = await createAdminClient();
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  const { error } = await supabase
    .from("profiles")
    .update({
      is_subscriber: isActiveSubscriptionStatus(subscription.status),
      stripe_subscription_id: subscription.id,
    })
    .eq("stripe_customer_id", customerId);

  if (error) {
    console.error(`Stripe webhook: failed to sync profile for customer ${customerId}:`, error.message);
  }
}

export async function POST(request: Request) {
  if (!isStripeConfigured || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Billing isn't set up yet." }, { status: 200 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const body = await request.text();
  const stripe = getStripeClient();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 });
  }

  switch (event.type) {
    // Covers trial start, renewals, upgrades/downgrades, cancellations
    // (immediate or at period end), and payment failures — Stripe
    // represents all of these as a status change on the subscription
    // object, so one handler covers the whole lifecycle.
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await syncSubscriptionStatus(event.data.object as Stripe.Subscription);
      break;
    default:
      // Other event types (invoice.*, payment_intent.*, etc.) aren't
      // needed for the is_subscriber gate — ignored rather than erroring.
      break;
  }

  return NextResponse.json({ received: true });
}
