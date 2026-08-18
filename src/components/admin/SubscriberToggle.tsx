"use client";

import { useState, useTransition } from "react";
import { setSubscriberAction } from "@/app/admin/members/actions";
import { cn } from "@/lib/utils";

export function SubscriberToggle({
  userId,
  initialIsSubscriber,
}: {
  userId: string;
  initialIsSubscriber: boolean;
}) {
  const [isSubscriber, setIsSubscriber] = useState(initialIsSubscriber);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !isSubscriber;
    setIsSubscriber(next);
    startTransition(async () => {
      try {
        await setSubscriberAction(userId, next);
      } catch {
        setIsSubscriber(!next);
      }
    });
  }

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
      {isSubscriber ? "Subscriber" : "Not Subscribed"}
    </button>
  );
}
