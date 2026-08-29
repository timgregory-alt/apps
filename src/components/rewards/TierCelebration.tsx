"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { RewardTier } from "@/lib/types";

function storageKey(userId: string) {
  return `twt-highest-tier-${userId}`;
}

/** Detects when a guest's lifetime points have newly crossed a reward tier's
 * threshold and celebrates it. Points are derived, never stored, so there's
 * no server-side "last seen tier" to diff against — this compares the
 * current highest-unlocked tier to one remembered in localStorage per user,
 * on each Rewards page load. */
export function TierCelebration({
  userId,
  tiers,
  lifetimeTotal,
}: {
  userId: string;
  tiers: RewardTier[];
  lifetimeTotal: number;
}) {
  const [newTier, setNewTier] = useState<RewardTier | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
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
    }, 0);
    return () => clearTimeout(timer);
  }, [userId, tiers, lifetimeTotal]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {newTier && (
        <motion.div
          className="texture-grain fixed inset-0 z-[60] flex flex-col items-center justify-center bg-[var(--color-charcoal)] px-8 text-center text-[var(--color-ivory)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          role="status"
          aria-live="polite"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(176,144,79,0.18),transparent_55%)]" />
          <div
            className="animate-impact-flash pointer-events-none absolute inset-0 bg-[var(--color-gold-pale)]"
            aria-hidden="true"
          />

          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.15, type: "spring", damping: 16, stiffness: 240 }}
            className="animate-impact-shake relative flex w-full max-w-xs flex-col items-center gap-4"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-gold)]/20">
              <PartyPopper size={28} className="text-[var(--color-gold)]" strokeWidth={1.75} />
            </span>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-[var(--color-gold)]">
              New Tier Unlocked
            </p>
            <p className="font-serif-display text-3xl">Congratulations!</p>
            <p className="text-[1.05rem] text-[var(--color-ivory)]/85">
              You&rsquo;ve reached <span className="font-medium">{newTier.label}</span> —{" "}
              {newTier.points_required} lifetime points earned.
            </p>

            <Button variant="gold" fullWidth onClick={() => setNewTier(null)}>
              Nice!
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
