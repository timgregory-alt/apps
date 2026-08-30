"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import confetti from "canvas-confetti";
import { PartyPopper, Share2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CenteredDialog } from "@/components/ui/CenteredDialog";
import { ShareSheet } from "@/components/share/ShareSheet";
import { onPointsChanged } from "@/lib/pointsEvents";
import type { RewardTier } from "@/lib/types";

function storageKey(userId: string) {
  return `twt-highest-tier-${userId}`;
}

const CONFETTI_COLORS = ["#b0904f", "#cfb579", "#e8dcb8", "#5e1a2e"];

function fireConfetti() {
  const shared = { colors: CONFETTI_COLORS, zIndex: 9999, disableForReducedMotion: true };
  confetti({ ...shared, particleCount: 90, spread: 75, startVelocity: 45, origin: { y: 0.35 } });
  window.setTimeout(() => {
    confetti({ ...shared, particleCount: 50, spread: 100, startVelocity: 30, scalar: 0.85, origin: { y: 0.4 } });
  }, 200);
}

/** /api/rewards/status recomputes points from several queries — too heavy
 * to run on every single navigation. This periodic check is a low-frequency
 * fallback (e.g. for points that change from someone else's actions, like a
 * referral) — the responsive path is notifyPointsChanged(), fired right
 * after a check-in or wine rating succeeds, which bypasses this throttle
 * since it's inherently rate-limited by how often someone can actually earn
 * points. */
const MIN_PERIODIC_CHECK_INTERVAL_MS = 5 * 60_000;

interface RewardsStatus {
  loggedIn: boolean;
  userId?: string;
  lifetimeTotal?: number;
  tiers?: RewardTier[];
}

/** Mounted once in the root layout so it can catch a newly crossed reward
 * tier on any guest-facing screen, not just the Rewards page. Skips /admin
 * routes entirely — that's staff tooling, not something a guest
 * experiences. Points are derived, never stored, so there's no server-side
 * "last seen tier" to diff against — this compares the current
 * highest-unlocked tier to one remembered in localStorage per user. */
export function GlobalTierCelebration() {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const [newTier, setNewTier] = useState<RewardTier | null>(null);
  const [celebrationOpen, setCelebrationOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const lastCheckedAt = useRef(0);

  const checkForNewTier = useCallback((bypassThrottle: boolean) => {
    if (pathnameRef.current.startsWith("/admin") || pathnameRef.current.startsWith("/portal")) return;

    const now = Date.now();
    if (!bypassThrottle && now - lastCheckedAt.current < MIN_PERIODIC_CHECK_INTERVAL_MS) return;
    lastCheckedAt.current = now;

    fetch("/api/rewards/status")
      .then((res) => (res.ok ? (res.json() as Promise<RewardsStatus>) : null))
      .then((data) => {
        if (!data?.loggedIn || !data.userId || !data.tiers) return;
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
          setCelebrationOpen(true);
          try {
            localStorage.setItem(storageKey(userId), String(highest.points_required));
          } catch {
            // Nothing to fall back to — worst case the celebration repeats next visit.
          }
        }
      })
      .catch(() => {
        // Best-effort — a missed check just means the celebration shows up next time.
      });
  }, []);

  useEffect(() => {
    checkForNewTier(false);
  }, [pathname, checkForNewTier]);

  useEffect(() => onPointsChanged(() => checkForNewTier(true)), [checkForNewTier]);

  useEffect(() => {
    if (celebrationOpen) fireConfetti();
  }, [celebrationOpen]);

  return (
    <>
      <CenteredDialog
        open={celebrationOpen}
        onClose={() => setCelebrationOpen(false)}
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
            <div className="mt-6 flex w-full flex-col gap-2.5">
              <Button
                variant="gold"
                fullWidth
                onClick={() => {
                  setCelebrationOpen(false);
                  setShareOpen(true);
                }}
              >
                <Share2 size={16} strokeWidth={2} />
                Share This Milestone
              </Button>
              <Button variant="ghost" fullWidth onClick={() => setCelebrationOpen(false)}>
                Nice!
              </Button>
            </div>
          </div>
        )}
      </CenteredDialog>

      {newTier && (
        <ShareSheet
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          wineryId={null}
          headline={newTier.label}
          subheadline="NEW REWARD UNLOCKED"
          checklist={[`${newTier.points_required} Lifetime Points`]}
          visited={0}
          total={0}
          shareUrl="https://tennesseewinetrails.com"
        />
      )}
    </>
  );
}
