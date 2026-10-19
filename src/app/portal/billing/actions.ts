"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getWineryStaffContext } from "@/lib/portal";
import { getStripeClient, getWineryAnalyticsPriceId, isStripeConfigured } from "@/lib/stripe";

async function siteOrigin(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : "https://winetrailonline.com";
}

/** Starts a Stripe Checkout session for the winery analytics add-on and
 * redirects there. Billed to the winery itself (via its own Stripe
 * customer), not the signed-in staff member — any staff account can start
 * or manage it, same as everyone with portal access shares the winery's
 * other settings. */
export async function createWineryAnalyticsCheckoutAction(): Promise<{ error: string } | void> {
  if (!isStripeConfigured) return { error: "Billing isn't set up yet." };

  const priceId = getWineryAnalyticsPriceId();
  if (!priceId) return { error: "Analytics billing isn't configured yet." };

  const ctx = await getWineryStaffContext();
  if (!ctx) return { error: "Sign in to a winery account to subscribe." };

  const supabase = await createClient();

  // Stripe's SDK throws on API errors (unlike Supabase's {data, error}
  // tuples) — this Next.js version redacts an uncaught Server Action
  // exception into a generic, unhelpful error on the client, so those
  // calls need to be caught explicitly. redirect() itself works by
  // throwing internally, so it stays outside this try/catch — otherwise
  // this catch block would swallow that as a fake "error" too.
  let checkoutUrl: string;
  try {
    const stripe = getStripeClient();
    let customerId = ctx.winery.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        name: ctx.winery.name,
        email: ctx.email ?? undefined,
        metadata: { winery_id: ctx.winery.id },
      });
      customerId = customer.id;
      await supabase.from("wineries").update({ stripe_customer_id: customerId }).eq("id", ctx.winery.id);
    }

    const origin = await siteOrigin();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: { trial_period_days: 7 },
      success_url: `${origin}/portal?subscribed=1`,
      cancel_url: `${origin}/portal`,
    });

    if (!session.url) return { error: "Could not start checkout. Please try again." };
    checkoutUrl = session.url;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not start checkout. Please try again." };
  }

  redirect(checkoutUrl);
}

/** Sends the winery to Stripe's hosted Customer Portal to update its card,
 * or cancel the analytics add-on — self-service, no admin needed. */
export async function createWineryAnalyticsBillingPortalAction(): Promise<{ error: string } | void> {
  if (!isStripeConfigured) return { error: "Billing isn't set up yet." };

  const ctx = await getWineryStaffContext();
  if (!ctx) return { error: "Sign in to a winery account to manage billing." };
  if (!ctx.winery.stripe_customer_id) return { error: "No subscription found for this winery." };

  let portalUrl: string;
  try {
    const stripe = getStripeClient();
    const origin = await siteOrigin();
    const session = await stripe.billingPortal.sessions.create({
      customer: ctx.winery.stripe_customer_id,
      return_url: `${origin}/portal`,
    });
    portalUrl = session.url;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not open billing management. Please try again." };
  }

  redirect(portalUrl);
}
