"use client";

import { useState, useTransition } from "react";
import { setSubscriberAction } from "@/app/admin/members/actions";
import { cn } from "@/lib/utils";

/** Click still manually toggles is_subscriber (a testing override, from
 * before real billing existed) — the richer label is purely cosmetic,
 * read from the real Stripe status the webhook last synced. A manual
 * toggle doesn't touch subscriptionStatus, so flipping it back on after a
 * toggle-off still shows "Trial" if that's genuinely where Stripe has
 * them. */
export function SubscriberToggle({
  userId,
  initialIsSubscriber,
  subscriptionStatus,
}: {
  userId: string;
  initialIsSubscriber: boolean;
  subscriptionStatus: string | null;
}) {
  const [isSubscriber, setIsSubscriber] = useState(initialIsSubscriber);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !isSubscriber;
    setIsSubscriber(next);
    startTransition(async () => {
      const result = await setSubscriberAction(userId, next);
      if (result?.error) {
        setIsSubscriber(!next);
      }
    });
  }

  const label = isSubscriber
    ? subscriptionStatus === "trialing"
      ? "Trial"
      : "Subscribed"
    : "Not Subscribed";

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={cn(
        "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50",
        isSubscriber
          ? "bg-[var(--color-gold-pale)] text-[var(--color-burgundy-deep)]"
          : "bg-black/5 text-[var(--color-charcoal)]/55 hover:bg-black/10"
      )}
    >
      {label}
    </button>
  );
}
