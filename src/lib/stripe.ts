import "server-only";
import Stripe from "stripe";

export const isStripeConfigured = !!process.env.STRIPE_SECRET_KEY;

let client: Stripe | null = null;

/** Lazily-created Stripe client — avoids throwing at import time in
 * environments (local dev, previews) where billing isn't configured yet. */
export function getStripeClient(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  if (!client) {
    client = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return client;
}

export type SubscriptionPlan = "monthly" | "annual";

/** Price IDs come from the Stripe dashboard (Products → your subscription
 * product → each Price's ID, starting with `price_`) — set once real
 * pricing is finalized there. */
export function getPriceId(plan: SubscriptionPlan): string | null {
  const key = plan === "monthly" ? "STRIPE_PRICE_ID_MONTHLY" : "STRIPE_PRICE_ID_ANNUAL";
  return process.env[key] || null;
}

/** Statuses that count as "has an active subscription" for gating premium
 * features — trialing guests get the perks during their free trial too. */
export function isActiveSubscriptionStatus(status: Stripe.Subscription.Status): boolean {
  return status === "trialing" || status === "active";
}
