"use client";

import { useState, useTransition } from "react";
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

  // Reward-tier discounts are admin-configurable, so pull the actual
  // subscriber-boosted percentages instead of hardcoding numbers that
  // would drift out of sync whenever a tier is edited.
  const discountBenefits = tiers
    .filter(
      (t) =>
        t.subscriber_discount_percent != null && t.subscriber_discount_percent > t.discount_percent
    )
    .map(
      (t) =>
        `${t.label}: ${t.subscriber_discount_percent}% off food & merch, instead of ${t.discount_percent}%`
    );
  const benefits = [...BASE_BENEFITS, ...discountBenefits];

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
