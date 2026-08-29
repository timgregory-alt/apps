"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CenteredDialog } from "@/components/ui/CenteredDialog";
import type { RewardTier } from "@/lib/types";

function storageKey(userId: string) {
  return `twt-highest-tier-${userId}`;
}

/** /api/rewards/status recomputes points from several queries — too heavy
 * to run on every single navigation. A prior, much shorter throttle here
 * (20s) coincided with the production database going unhealthy on its
 * smallest compute tier, so this is now deliberately conservative: still
 * covers "any screen" over the course of a normal visit, just far less
 * often. */
const MIN_CHECK_INTERVAL_MS = 5 * 60_000;

interface RewardsStatus {
  loggedIn: boolean;
  userId?: string;
  lifetimeTotal?: number;
  tiers?: RewardTier[];
}

/** Mounted once in the root layout so it can catch a newly crossed reward
 * tier on any screen, not just the Rewards page — re-checks on navigation,
 * throttled to avoid re-running the points computation on every single tap.
 * Points are derived, never stored, so there's no server-side "last seen
 * tier" to diff against — this compares the current highest-unlocked tier
 * to one remembered in localStorage per user. */
export function GlobalTierCelebration() {
  const pathname = usePathname();
  const [newTier, setNewTier] = useState<RewardTier | null>(null);
  const lastCheckedAt = useRef(0);

  useEffect(() => {
    const now = Date.now();
    if (now - lastCheckedAt.current < MIN_CHECK_INTERVAL_MS) return;
    lastCheckedAt.current = now;

    let cancelled = false;

    fetch("/api/rewards/status")
      .then((res) => (res.ok ? (res.json() as Promise<RewardsStatus>) : null))
      .then((data) => {
        if (cancelled || !data?.loggedIn || !data.userId || !data.tiers) return;
        const { userId, tiers } = data;
        const lifetimeTotal = data.lifetimeTotal ?? 0;

        const unlocked = tiers.filter((t) => lifetimeTotal >= t.points_required);
        if (unlocked.length === 0) return;
        const highest = unlocked.reduce((a, b) => (b.points_required > a.points_required ? b : a));

        let seen = 0;
        try {
          seen = Number(localStorage.getItem(storageKey(userId)) ?? 0);
        } catch {
          return;
        }

        if (highest.points_required > seen) {
          setNewTier(highest);
          try {
            localStorage.setItem(storageKey(userId), String(highest.points_required));
          } catch {
            // Nothing to fall back to — worst case the celebration repeats next visit.
          }
        }
      })
      .catch(() => {
        // Best-effort — a missed check just means the celebration shows up
        // on the next screen instead.
      });

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return (
    <CenteredDialog
      open={newTier != null}
      onClose={() => setNewTier(null)}
      labelledBy="tier-celebration-title"
    >
      {newTier && (
        <div className="flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-gold-pale)]">
            <PartyPopper size={22} className="text-[var(--color-burgundy)]" strokeWidth={1.5} />
          </span>
          <p className="mt-4 text-xs font-medium uppercase tracking-[0.24em] text-[var(--color-gold)]">
            New Tier Unlocked
          </p>
          <h2
            id="tier-celebration-title"
            className="font-serif-display mt-1 text-3xl text-[var(--color-charcoal)]"
          >
            Congratulations!
          </h2>
          <p className="mt-2 max-w-[32ch] text-sm text-[var(--color-charcoal)]/65">
            You&rsquo;ve reached <span className="font-medium">{newTier.label}</span> —{" "}
            {newTier.points_required} lifetime points earned.
          </p>
          <div className="mt-6 w-full">
            <Button fullWidth onClick={() => setNewTier(null)}>
              Nice!
            </Button>
          </div>
        </div>
      )}
    </CenteredDialog>
  );
}
