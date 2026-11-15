"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  createCheckoutSessionAction,
  createBillingPortalSessionAction,
  createTravelPassCheckoutAction,
} from "@/app/profile/actions";
import { SUBSCRIBER_MULTIPLIER } from "@/lib/rewards";
import { formatCheckinDate, cn } from "@/lib/utils";
import type { RewardTier } from "@/lib/types";

// Display-only — keep in sync with the actual Stripe Prices configured
// via STRIPE_PRICE_ID_MONTHLY / STRIPE_PRICE_ID_ANNUAL / STRIPE_PRICE_ID_TRAVEL_PASS,
// since none of these are fetched live from Stripe.
const MONTHLY_PRICE = "6.99";
const ANNUAL_PRICE = "59.88";
const ANNUAL_SAVINGS_PERCENT = 29;
const TRAVEL_PASS_PRICE = "19.99";
const TRAVEL_PASS_DAYS = 2;
// Keep in sync with TRAVEL_PASS_BONUS_POINTS in src/lib/rewards.ts.
const TRAVEL_PASS_BONUS_POINTS = 50;

// VIP events get a 10-day subscriber-only early-access window (see
// VIP_EARLY_ACCESS_HOURS in src/lib/data.ts) — regular events are never
// locked. Keep this line honest about "early access," not permanent
// exclusivity — non-subscribers do eventually see VIP events too, just later.
const BASE_BENEFITS = [
  `Earn ${SUBSCRIBER_MULTIPLIER}× points on winery check-ins, ratings, and referrals`,
  "Get early access to VIP events and special experiences",
  "Reach exclusive reward tiers faster",
];

// Deliberately a shorter list than BASE_BENEFITS — "early access to VIP
// events" and "reach tiers faster" assume an ongoing relationship with
// points already banked, which doesn't hold for someone who's only around
// for a couple of days. Only claims that are true and useful within the
// pass's own window.
const TRAVEL_PASS_BENEFITS = [
  `Earn ${SUBSCRIBER_MULTIPLIER}× points on every check-in and rating this trip`,
  `Keep ${TRAVEL_PASS_BONUS_POINTS} bonus points forever — even after your pass expires`,
  "No subscription, no commitment — just this trip",
];

type PendingAction = "monthly" | "annual" | "travel_pass" | "manage" | null;

export function SubscriptionUpsellCard({
  hasActiveSubscription,
  travelPassExpiresAt,
  tiers,
}: {
  /** True only for a real, recurring Stripe subscription — distinct from
   * profiles.is_subscriber, which a Travel Pass also sets but has no
   * subscription to manage. */
  hasActiveSubscription: boolean;
  /** Set only while a Travel Pass is active; null otherwise. */
  travelPassExpiresAt: string | null;
  tiers: RewardTier[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction>(null);
  const [, startTransition] = useTransition();

  const travelPassActive = !hasActiveSubscription && !!travelPassExpiresAt && new Date(travelPassExpiresAt) > new Date();

  // The biggest subscriber-only discount boost actually configured on any
  // tier — computed live rather than hardcoded, so the claim on the card
  // never overstates what's really available (and disappears cleanly if
  // every boost is ever removed).
  const maxSubscriberDiscount = tiers.reduce(
    (max, t) =>
      t.subscriber_discount_percent != null && t.subscriber_discount_percent > t.discount_percent
        ? Math.max(max, t.subscriber_discount_percent)
        : max,
    0
  );
  const hasSubscriberDiscounts = maxSubscriberDiscount > 0;
  // Leads with the concrete dollar-savings perk — it's a provable ROI a
  // guest can redeem on their very next visit, unlike the points/tier
  // perks below, which only pay off for frequent visitors.
  const benefits = hasSubscriberDiscounts
    ? [
        `Save up to ${maxSubscriberDiscount}% extra off tastings, food & merch at top reward tiers`,
        ...BASE_BENEFITS,
      ]
    : BASE_BENEFITS;

  function subscribe(plan: "monthly" | "annual") {
    setError(null);
    setPending(plan);
    startTransition(async () => {
      const result = await createCheckoutSessionAction(plan);
      // A successful call redirects away — reaching this point means it
      // didn't, so surface the error and let the button re-enable.
      if (result?.error) setError(result.error);
      setPending(null);
    });
  }

  function buyTravelPass() {
    setError(null);
    setPending("travel_pass");
    startTransition(async () => {
      const result = await createTravelPassCheckoutAction();
      if (result?.error) setError(result.error);
      setPending(null);
    });
  }

  function manage() {
    setError(null);
    setPending("manage");
    startTransition(async () => {
      const result = await createBillingPortalSessionAction();
      if (result?.error) setError(result.error);
      setPending(null);
    });
  }

  if (hasActiveSubscription) {
    return (
      <Card
        id="premium"
        className="relative flex flex-col gap-3 overflow-hidden bg-[var(--color-burgundy)] p-5 text-[var(--color-ivory)]"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-[var(--color-gold-pale)]" />
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-gold-pale)]">
            You&rsquo;re Subscribed
          </p>
        </div>

        <ul className="flex flex-col gap-1.5">
          {benefits.map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm text-[var(--color-ivory)]/85">
              <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[var(--color-gold-pale)]" />
              {b}
            </li>
          ))}
        </ul>

        {error && <p className="text-sm text-[var(--color-gold-pale)]">{error}</p>}

        <Link
          href="/vip"
          className="text-center text-xs font-medium text-[var(--color-gold-pale)] underline underline-offset-2"
        >
          See VIP Events
        </Link>

        <Button type="button" variant="ivory" fullWidth onClick={manage} disabled={pending !== null}>
          {pending === "manage" ? "Opening…" : "Manage Subscription"}
        </Button>
      </Card>
    );
  }

  if (travelPassActive && travelPassExpiresAt) {
    return (
      <Card
        id="premium"
        className="relative flex flex-col gap-3 overflow-hidden bg-[var(--color-burgundy)] p-5 text-[var(--color-ivory)]"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-[var(--color-gold-pale)]" />
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-gold-pale)]">
            Travel Pass Active
          </p>
        </div>
        <p className="text-sm text-[var(--color-ivory)]/70">
          Your Travel Pass is active through {formatCheckinDate(travelPassExpiresAt)}.
        </p>

        <ul className="flex flex-col gap-1.5">
          {benefits.map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm text-[var(--color-ivory)]/85">
              <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[var(--color-gold-pale)]" />
              {b}
            </li>
          ))}
        </ul>

        {error && <p className="text-sm text-[var(--color-gold-pale)]">{error}</p>}

        <Link
          href="/vip"
          className="text-center text-xs font-medium text-[var(--color-gold-pale)] underline underline-offset-2"
        >
          See VIP Events
        </Link>

        <button
          type="button"
          onClick={() => subscribe("monthly")}
          disabled={pending !== null}
          className="w-full rounded-full border border-[var(--color-gold-pale)]/35 px-5 py-2.5 text-sm font-medium text-[var(--color-gold-pale)] transition-colors hover:border-[var(--color-gold-pale)] hover:bg-[var(--color-gold-pale)]/10 disabled:opacity-60"
        >
          {pending === "monthly" ? "Starting…" : "Visiting often? Subscribe for ongoing access"}
        </button>
      </Card>
    );
  }

  return (
    <div id="premium" className="flex flex-col gap-3">
      <UpsellCarousel
        benefits={benefits}
        pending={pending}
        error={error}
        onMonthly={() => subscribe("monthly")}
        onAnnual={() => subscribe("annual")}
        onTravelPass={buyTravelPass}
      />
    </div>
  );
}

function SubscriptionPlanCard({
  benefits,
  pending,
  error,
  onMonthly,
  onAnnual,
}: {
  benefits: string[];
  pending: PendingAction;
  error: string | null;
  onMonthly: () => void;
  onAnnual: () => void;
}) {
  return (
    <Card className="relative flex flex-col gap-4 overflow-hidden bg-[var(--color-burgundy)] p-6 text-center text-[var(--color-ivory)]">
      <div className="flex items-center justify-center gap-2">
        <Sparkles size={16} className="text-[var(--color-gold-pale)]" />
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-gold-pale)]">
          Tennessee Wine Trails VIP
        </p>
      </div>

      <h2 className="font-serif-display text-[1.75rem] leading-[1.15] text-[var(--color-ivory)]">
        Make Every Winery Visit More Rewarding
      </h2>

      <p className="flex items-baseline justify-center gap-1">
        <span className="font-serif-display text-4xl text-[var(--color-ivory)]">${MONTHLY_PRICE}</span>
        <span className="text-sm text-[var(--color-ivory)]/60">/month</span>
      </p>

      <p className="text-sm text-[var(--color-ivory)]/70">
        Exclusive rewards, experiences, and perks for Tennessee wine lovers.
      </p>

      <div className="border-t border-[var(--color-ivory)]/15" />

      <ul className="flex flex-col gap-2.5 text-left">
        {benefits.map((b) => (
          <li key={b} className="flex items-start gap-2.5 text-sm text-[var(--color-ivory)]/85">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[var(--color-gold-pale)]" />
            {b}
          </li>
        ))}
      </ul>

      {error && <p className="text-sm text-[var(--color-gold-pale)]">{error}</p>}

      <Link
        href="/vip"
        className="text-center text-xs font-medium text-[var(--color-gold-pale)] underline underline-offset-2"
      >
        See VIP Events
      </Link>

      <div className="flex flex-col gap-2.5">
        <Button type="button" variant="gold" fullWidth onClick={onMonthly} disabled={pending !== null}>
          {pending === "monthly" ? "Starting…" : "Subscribe Monthly"}
        </Button>

        <p className="text-center text-[0.68rem] text-[var(--color-ivory)]/50">
          Billed ${MONTHLY_PRICE}/month. Cancel anytime.
        </p>

        <button
          type="button"
          onClick={onAnnual}
          disabled={pending !== null}
          className="w-full rounded-full border border-[var(--color-gold-pale)]/35 px-5 py-2.5 text-sm font-medium text-[var(--color-gold-pale)] transition-colors hover:border-[var(--color-gold-pale)] hover:bg-[var(--color-gold-pale)]/10 disabled:opacity-60"
        >
          {pending === "annual"
            ? "Starting…"
            : `Save ${ANNUAL_SAVINGS_PERCENT}% with Annual — $${ANNUAL_PRICE}/year`}
        </button>
      </div>
    </Card>
  );
}

function TravelPassCard({
  pending,
  error,
  onBuy,
}: {
  pending: PendingAction;
  error: string | null;
  onBuy: () => void;
}) {
  return (
    <Card className="relative flex flex-col gap-4 overflow-hidden bg-[var(--color-burgundy)] p-6 text-center text-[var(--color-ivory)]">
      <div className="flex items-center justify-center gap-2">
        <Sparkles size={16} className="text-[var(--color-gold-pale)]" />
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-gold-pale)]">
          Just Visiting?
        </p>
      </div>

      <h2 className="font-serif-display text-[1.75rem] leading-[1.15] text-[var(--color-ivory)]">
        Get VIP Perks for Your Trip
      </h2>

      <p className="flex items-baseline justify-center gap-1">
        <span className="font-serif-display text-4xl text-[var(--color-ivory)]">${TRAVEL_PASS_PRICE}</span>
        <span className="text-sm text-[var(--color-ivory)]/60">/ {TRAVEL_PASS_DAYS} days</span>
      </p>

      <p className="text-sm text-[var(--color-ivory)]/70">
        No subscription — just a quick boost for the time you&rsquo;re here.
      </p>

      <div className="border-t border-[var(--color-ivory)]/15" />

      <ul className="flex flex-col gap-2.5 text-left">
        {TRAVEL_PASS_BENEFITS.map((b) => (
          <li key={b} className="flex items-start gap-2.5 text-sm text-[var(--color-ivory)]/85">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[var(--color-gold-pale)]" />
            {b}
          </li>
        ))}
      </ul>

      {error && <p className="text-sm text-[var(--color-gold-pale)]">{error}</p>}

      <Button type="button" variant="gold" fullWidth onClick={onBuy} disabled={pending !== null}>
        {pending === "travel_pass" ? "Starting…" : `Get ${TRAVEL_PASS_DAYS}-Day Travel Pass`}
      </Button>

      <p className="text-center text-[0.68rem] text-[var(--color-ivory)]/50">
        One-time charge. No subscription to cancel.
      </p>
    </Card>
  );
}

function UpsellCarousel({
  benefits,
  pending,
  error,
  onMonthly,
  onAnnual,
  onTravelPass,
}: {
  benefits: string[];
  pending: PendingAction;
  error: string | null;
  onMonthly: () => void;
  onAnnual: () => void;
  onTravelPass: () => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const slideCount = 2;

  function onScroll() {
    const track = trackRef.current;
    if (!track) return;
    setActiveIndex(Math.round(track.scrollLeft / track.clientWidth));
  }

  function scrollToIndex(index: number) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="w-full shrink-0 snap-center">
          <SubscriptionPlanCard benefits={benefits} pending={pending} error={error} onMonthly={onMonthly} onAnnual={onAnnual} />
        </div>
        <div className="w-full shrink-0 snap-center">
          <TravelPassCard pending={pending} error={error} onBuy={onTravelPass} />
        </div>
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          aria-label="Previous plan"
          onClick={() => scrollToIndex(Math.max(0, activeIndex - 1))}
          disabled={activeIndex === 0}
          className="text-[var(--color-charcoal)]/50 disabled:opacity-25"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex items-center gap-1.5">
          {Array.from({ length: slideCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={i === 0 ? "Show subscription plans" : "Show Travel Pass"}
              onClick={() => scrollToIndex(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === activeIndex ? "w-5 bg-[var(--color-burgundy)]" : "w-1.5 bg-[var(--color-charcoal)]/20"
              )}
            />
          ))}
        </div>

        <button
          type="button"
          aria-label="Next plan"
          onClick={() => scrollToIndex(Math.min(slideCount - 1, activeIndex + 1))}
          disabled={activeIndex === slideCount - 1}
          className="text-[var(--color-charcoal)]/50 disabled:opacity-25"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <p className="text-center text-xs text-[var(--color-charcoal)]/45">
        {activeIndex === 0 ? "Subscribe for ongoing access" : "One-time pass for your trip"}
      </p>
    </div>
  );
}
