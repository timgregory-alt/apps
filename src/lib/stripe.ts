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

/** Sums succeeded charges, minus any refunds, since the 1st of the current
 * calendar month — covers one-time Travel Pass purchases and subscription
 * invoice payments alike, since Stripe backs both with a charge. Returns
 * null when billing isn't configured, so the caller can show "—" instead
 * of a misleading $0. Used only by the admin dashboard's actual-vs-target
 * revenue card. */
export async function getActualRevenueThisMonth(): Promise<number | null> {
  if (!isStripeConfigured) return null;

  const stripe = getStripeClient();
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  let totalCents = 0;
  for await (const charge of stripe.charges.list({
    created: { gte: Math.floor(startOfMonth.getTime() / 1000) },
    limit: 100,
  })) {
    if (charge.paid) totalCents += charge.amount - charge.amount_refunded;
  }

  return totalCents / 100;
}

/** Statuses that count as "has an active subscription" for gating premium
 * features. Checkout no longer offers a free trial, but "trialing" still
 * counts here in case a subscription is ever manually trialed from the
 * Stripe dashboard. */
export function isActiveSubscriptionStatus(status: Stripe.Subscription.Status): boolean {
  return status === "trialing" || status === "active";
}
