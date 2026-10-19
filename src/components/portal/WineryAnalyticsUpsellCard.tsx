"use client";

import { useState, useTransition } from "react";
import { BarChart3, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  createWineryAnalyticsCheckoutAction,
  createWineryAnalyticsBillingPortalAction,
} from "@/app/portal/billing/actions";

const BENEFITS = [
  "Page views and wine club click-through rate",
  "Guest age groups and where guests are coming from",
  "Peak visit day and time, so you know when to staff up",
  "Your most-loved wines, ranked by guest ratings",
];

/** Gates the deep-analytics section of the portal dashboard — basic counts
 * (upcoming events, total/repeat guests) and the QR code stay free
 * regardless; this card either sells the $50/mo add-on or, once
 * subscribed, offers a quiet way to manage/cancel it. */
export function WineryAnalyticsUpsellCard({ isSubscribed }: { isSubscribed: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [pendingPlan, setPendingPlan] = useState<"monthly" | "annual" | "manage" | null>(null);
  const [, startTransition] = useTransition();

  function subscribe(plan: "monthly" | "annual") {
    setError(null);
    setPendingPlan(plan);
    startTransition(async () => {
      const result = await createWineryAnalyticsCheckoutAction(plan);
      // A successful call redirects away — reaching this point means it
      // didn't, so surface the error and let the buttons re-enable.
      if (result?.error) setError(result.error);
      setPendingPlan(null);
    });
  }

  function manage() {
    setError(null);
    setPendingPlan("manage");
    startTransition(async () => {
      const result = await createWineryAnalyticsBillingPortalAction();
      if (result?.error) setError(result.error);
      setPendingPlan(null);
    });
  }

  if (isSubscribed) {
    return (
      <div className="flex flex-col gap-1.5 rounded-2xl border border-[var(--color-line)] bg-white px-5 py-3.5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-[var(--color-charcoal)]/55">Winery Analytics is active.</p>
          <button
            type="button"
            onClick={manage}
            disabled={pendingPlan !== null}
            className="shrink-0 text-xs font-medium text-[var(--color-burgundy)] hover:underline disabled:opacity-60"
          >
            {pendingPlan === "manage" ? "Opening…" : "Manage Billing"}
          </button>
        </div>
        {error && <p className="text-xs text-[var(--color-burgundy)]">{error}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--color-gold)]/40 bg-[var(--color-gold-pale)]/20 p-5">
      <div className="flex items-center gap-2">
        <BarChart3 size={16} className="text-[var(--color-burgundy)]" />
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-burgundy)]">
          Winery Analytics
        </p>
      </div>
      <ul className="mt-3 flex flex-col gap-1.5">
        {BENEFITS.map((b) => (
          <li key={b} className="flex items-start gap-2 text-sm text-[var(--color-charcoal)]/75">
            <Check size={14} className="mt-0.5 shrink-0 text-[var(--color-gold)]" />
            {b}
          </li>
        ))}
      </ul>
      {error && <p className="mt-3 text-sm text-[var(--color-burgundy)]">{error}</p>}
      <div className="mt-4 flex flex-col gap-2">
        <Button
          type="button"
          variant="primary"
          fullWidth
          onClick={() => subscribe("monthly")}
          disabled={pendingPlan !== null}
        >
          {pendingPlan === "monthly" ? "Starting…" : "Subscribe Monthly — $50/mo"}
        </Button>
        <Button
          type="button"
          variant="outline"
          fullWidth
          onClick={() => subscribe("annual")}
          disabled={pendingPlan !== null}
        >
          {pendingPlan === "annual" ? "Starting…" : "Subscribe Annual — $500/yr"}
        </Button>
      </div>
      <p className="mt-2 text-center text-xs text-[var(--color-charcoal)]/50">
        Annual saves 2 months. Starts with a 7-day free trial — cancel anytime.
      </p>
    </div>
  );
}
