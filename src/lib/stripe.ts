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

/** The Travel Pass — a one-time (not recurring) $19.99 Price granting 2
 * days of full VIP access, for a guest who wants it for a single trip
 * rather than an ongoing subscription. */
export function getTravelPassPriceId(): string | null {
  return process.env.STRIPE_PRICE_ID_TRAVEL_PASS || null;
}

export const TRAVEL_PASS_DURATION_DAYS = 2;
export const TRAVEL_PASS_DURATION_MS = TRAVEL_PASS_DURATION_DAYS * 24 * 60 * 60 * 1000;

/** The winery portal's analytics dashboard add-on — $50/mo or $500/yr (2
 * months free), billed to the winery itself rather than any one staff
 * account. */
export function getWineryAnalyticsPriceId(plan: SubscriptionPlan): string | null {
  const key =
    plan === "monthly" ? "STRIPE_PRICE_ID_WINERY_ANALYTICS_MONTHLY" : "STRIPE_PRICE_ID_WINERY_ANALYTICS_ANNUAL";
  return process.env[key] || null;
}

/** Statuses that count as "has an active subscription" for gating premium
 * features. Checkout no longer offers a free trial, but "trialing" still
 * counts here in case a subscription is ever manually trialed from the
 * Stripe dashboard. */
export function isActiveSubscriptionStatus(status: Stripe.Subscription.Status): boolean {
  return status === "trialing" || status === "active";
}
