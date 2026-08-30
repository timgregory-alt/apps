"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TrailCoverFrame } from "@/components/ui/TrailCoverFrame";
import { toggleSubscriptionAction } from "@/app/profile/actions";
import { SUBSCRIBER_MULTIPLIER } from "@/lib/rewards";
import type { RewardTier } from "@/lib/types";

const BASE_BENEFITS = [
  `Earn ${SUBSCRIBER_MULTIPLIER}x points on every check-in, wine rating, and referral`,
  "Early access to new winery events, before anyone else sees them",
  "Unlock gated features, like winery review links",
];

export function SubscriptionUpsellCard({
  isSubscriber,
  tiers,
}: {
  isSubscriber: boolean;
  tiers: RewardTier[];
}) {
  const [subscriber, setSubscriber] = useState(isSubscriber);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Whether any tier currently has a subscriber-only boost — checked
  // rather than hardcoded so this stops claiming a perk that isn't
  // actually configured if all the boosts are ever removed.
  const hasSubscriberDiscounts = tiers.some(
    (t) => t.subscriber_discount_percent != null && t.subscriber_discount_percent > t.discount_percent
  );
  const benefits = hasSubscriberDiscounts
    ? [...BASE_BENEFITS, "Access to bigger discounts on food, merch & tastings at select reward tiers"]
    : BASE_BENEFITS;

  function toggle() {
    const next = !subscriber;
    setError(null);
    startTransition(async () => {
      const result = await toggleSubscriptionAction(next);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setSubscriber(next);
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
          {subscriber ? "You're Subscribed" : "Go Premium"}
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

      <Button
        type="button"
        variant={subscriber ? "ivory" : "gold"}
        fullWidth
        onClick={toggle}
        disabled={pending}
        className="relative"
      >
        {pending ? "Updating…" : subscriber ? "Cancel Subscription" : "Upgrade to Subscriber"}
      </Button>

      <p className="relative text-center text-[0.68rem] text-[var(--color-ivory)]/50">
        Preview only — no payment required yet.
      </p>
    </Card>
  );
}
