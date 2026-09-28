"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TrailCoverFrame } from "@/components/ui/TrailCoverFrame";
import { createCheckoutSessionAction, createBillingPortalSessionAction } from "@/app/profile/actions";
import { SUBSCRIBER_MULTIPLIER } from "@/lib/rewards";
import type { RewardTier } from "@/lib/types";

// VIP events get a 10-day subscriber-only early-access window (see
// VIP_EARLY_ACCESS_HOURS in src/lib/data.ts) — regular events are never
// locked. Keep this line honest about "first access," not permanent
// exclusivity — non-subscribers do eventually see VIP events too, just later.
const BASE_BENEFITS = [
  "First access to VIP events — harvest dinners, member-only tastings — up to 10 days before anyone else",
  `Earn ${SUBSCRIBER_MULTIPLIER}x points on every check-in, wine rating, and referral`,
  "Unlock extra perks, like winery review links",
];

export function SubscriptionUpsellCard({
  isSubscriber,
  tiers,
}: {
  isSubscriber: boolean;
  tiers: RewardTier[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [pendingPlan, setPendingPlan] = useState<"monthly" | "annual" | "manage" | null>(null);
  const [, startTransition] = useTransition();

  // Whether any tier currently has a subscriber-only boost — checked
  // rather than hardcoded so this stops claiming a perk that isn't
  // actually configured if all the boosts are ever removed.
  const hasSubscriberDiscounts = tiers.some(
    (t) => t.subscriber_discount_percent != null && t.subscriber_discount_percent > t.discount_percent
  );
  const benefits = hasSubscriberDiscounts
    ? [...BASE_BENEFITS, "Access to bigger discounts on food, merch & tastings at select reward tiers"]
    : BASE_BENEFITS;

  function subscribe(plan: "monthly" | "annual") {
    setError(null);
    setPendingPlan(plan);
    startTransition(async () => {
      const result = await createCheckoutSessionAction(plan);
      // A successful call redirects away — reaching this point means it
      // didn't, so surface the error and let the button re-enable.
      if (result?.error) setError(result.error);
      setPendingPlan(null);
    });
  }

  function manage() {
    setError(null);
    setPendingPlan("manage");
    startTransition(async () => {
      const result = await createBillingPortalSessionAction();
      if (result?.error) setError(result.error);
      setPendingPlan(null);
    });
  }

  return (
    <Card
      id="premium"
      className="texture-grain relative flex flex-col gap-3 overflow-hidden bg-[var(--color-burgundy)] p-5 text-[var(--color-ivory)]"
    >
      <TrailCoverFrame />

      <div className="relative flex items-center gap-2">
        <Sparkles size={16} className="text-[var(--color-gold-pale)]" />
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-gold-pale)]">
          {isSubscriber ? "You're Subscribed" : "Go Premium"}
        </p>
      </div>

      <ul className="relative flex flex-col gap-1.5">
        {benefits.map((b) => (
          <li key={b} className="flex items-start gap-2 text-sm text-[var(--color-ivory)]/85">
            <Check size={14} className="mt-0.5 shrink-0 text-[var(--color-gold-pale)]" />
            {b}
          </li>
        ))}
      </ul>

      {error && <p className="relative text-sm text-[var(--color-gold-pale)]">{error}</p>}

      <Link
        href="/vip"
        className="relative text-center text-xs font-medium text-[var(--color-gold-pale)] underline underline-offset-2"
      >
        See VIP Events
      </Link>

      {isSubscriber ? (
        <Button
          type="button"
          variant="ivory"
          fullWidth
          onClick={manage}
          disabled={pendingPlan !== null}
          className="relative"
        >
          {pendingPlan === "manage" ? "Opening…" : "Manage Subscription"}
        </Button>
      ) : (
        <div className="relative flex flex-col gap-2">
          <Button
            type="button"
            variant="gold"
            fullWidth
            onClick={() => subscribe("monthly")}
            disabled={pendingPlan !== null}
          >
            {pendingPlan === "monthly" ? "Starting…" : "Subscribe Monthly"}
          </Button>
          <Button
            type="button"
            variant="ivory"
            fullWidth
            onClick={() => subscribe("annual")}
            disabled={pendingPlan !== null}
          >
            {pendingPlan === "annual" ? "Starting…" : "Subscribe Annual"}
          </Button>
        </div>
      )}

      {!isSubscriber && (
        <p className="relative text-center text-[0.68rem] text-[var(--color-ivory)]/50">
          Starts with a 7-day free trial — cancel anytime.
        </p>
      )}
    </Card>
  );
}
