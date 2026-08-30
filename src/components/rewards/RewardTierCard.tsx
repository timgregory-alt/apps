"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Gift, Check, Info, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { CenteredDialog } from "@/components/ui/CenteredDialog";
import { generateRedemptionAction } from "@/app/rewards/actions";
import { RedemptionCodeDisplay } from "@/components/rewards/RedemptionCodeDisplay";
import { discountLabel, effectiveDiscountPercent } from "@/lib/rewards";
import { cn } from "@/lib/utils";
import type { RewardRedemption, RewardTier } from "@/lib/types";

// Matches Card's own styling, applied directly to each flip face instead of
// a shared ancestor — backdrop-blur on an ancestor of a 3D-rotated subtree
// is a known source of backface-visibility rendering glitches in Chromium.
const CARD_FACE_CLASSES =
  "rounded-3xl border border-[var(--color-line)] bg-white/70 backdrop-blur-sm shadow-[0_1px_2px_rgba(36,33,29,0.04),0_12px_32px_-16px_rgba(36,33,29,0.18)]";

export function RewardTierCard({
  tier,
  balance,
  lifetimeTotal,
  isSubscriber,
}: {
  tier: RewardTier;
  /** Currently spendable — lifetime points minus points already redeemed. */
  balance: number;
  /** Lifetime points earned, for the permanent "unlocked" status badge —
   * never decreases, so a tier stays marked as reached even after its
   * points have been spent. */
  lifetimeTotal: number;
  isSubscriber: boolean;
}) {
  const [code, setCode] = useState<RewardRedemption | null>(null);
  const [confirmOption, setConfirmOption] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [isPending, startTransition] = useTransition();
  const everUnlocked = lifetimeTotal >= tier.points_required;
  const canRedeemNow = balance >= tier.points_required;
  const isChoiceTier = !!tier.choice_options && tier.choice_options.length > 0;
  const percent = effectiveDiscountPercent(tier, isSubscriber);
  const hasSubscriberBoost =
    tier.subscriber_discount_percent != null && tier.subscriber_discount_percent > tier.discount_percent;
  const showsSubscriberUpsell = !isSubscriber && hasSubscriberBoost;

  function reveal(option?: string) {
    setConfirmOption(null);
    setError(null);
    startTransition(async () => {
      const result = await generateRedemptionAction(tier.id, option);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setCode(result);
    });
  }

  return (
    <>
      {code ? (
        <Card className="flex flex-col gap-3 p-5">
          <TierHeader tier={tier} everUnlocked={everUnlocked} />
          <div className="flex flex-col items-center gap-3 border-t border-[var(--color-line)] pt-4">
            <p className="text-sm font-medium text-[var(--color-charcoal)]">
              {code.chosen_option ?? discountLabel(percent)}
            </p>
            <RedemptionCodeDisplay redemption={code} />
          </div>
        </Card>
      ) : (
        <div className="relative h-[22rem] w-full [perspective:1200px]">
          <motion.div
            className="relative h-full w-full [transform-style:preserve-3d]"
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Front — progress and redemption */}
            <div
              className={cn(
                CARD_FACE_CLASSES,
                "absolute inset-0 flex flex-col gap-3 p-5 [backface-visibility:hidden]"
              )}
            >
              <TierHeader tier={tier} everUnlocked={everUnlocked} />

              <ProgressBar value={Math.min(balance, tier.points_required)} max={tier.points_required} />
              {canRedeemNow ? (
                isChoiceTier ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-[var(--color-charcoal)]/70">Choose your reward:</p>
                    {tier.choice_options!.map((option) => (
                      <Button
                        key={option}
                        variant="outline"
                        size="sm"
                        onClick={() => setConfirmOption(option)}
                        disabled={isPending}
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-[var(--color-charcoal)]/70">{discountLabel(percent)}</p>
                    {showsSubscriberUpsell && (
                      <Link
                        href="/profile#premium"
                        className="text-xs text-[var(--color-burgundy)] underline decoration-[var(--color-burgundy)]/30 underline-offset-2"
                      >
                        Subscribers get {tier.subscriber_discount_percent}% off here — Go Premium
                      </Link>
                    )}
                    <Button onClick={() => setConfirmOption("")} disabled={isPending} size="sm">
                      Redeem for {tier.points_required} pts
                    </Button>
                  </>
                )
              ) : (
                <p className="text-xs text-[var(--color-charcoal)]/55">
                  {everUnlocked
                    ? `Earn ${tier.points_required - balance} more points to redeem this again`
                    : `${tier.points_required - balance} points to go`}
                </p>
              )}
              {error && <p className="text-xs text-[var(--color-burgundy)]">{error}</p>}

              <button
                type="button"
                onClick={() => setFlipped(true)}
                className="mt-auto flex items-center justify-center gap-1.5 rounded-full py-1.5 text-xs font-medium text-[var(--color-charcoal)]/50 hover:bg-black/5"
              >
                <Info size={13} strokeWidth={2} />
                What&rsquo;s Included
              </button>
            </div>

            {/* Back — benefits */}
            <div
              className={cn(
                CARD_FACE_CLASSES,
                "absolute inset-0 flex flex-col gap-3 overflow-y-auto p-5 [backface-visibility:hidden] [transform:rotateY(180deg)]"
              )}
            >
              <div className="flex items-center gap-1.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-gold)]/15 text-[var(--color-gold)]">
                  <Gift size={15} />
                </span>
                <div>
                  <p className="text-[0.65rem] font-medium uppercase tracking-wide text-[var(--color-charcoal)]/45">
                    {tier.label}
                  </p>
                  <p className="font-serif-display text-base text-[var(--color-charcoal)]">Benefits</p>
                </div>
              </div>

              <ul className="flex flex-col gap-2.5">
                {isChoiceTier ? (
                  <>
                    <li className="text-xs text-[var(--color-charcoal)]/55">Choose one when you redeem:</li>
                    {tier.choice_options!.map((option) => (
                      <li key={option} className="flex items-start gap-2 text-sm text-[var(--color-charcoal)]/80">
                        <Check size={14} className="mt-0.5 shrink-0 text-[var(--color-gold)]" />
                        {option}
                      </li>
                    ))}
                  </>
                ) : (
                  <>
                    <li className="flex items-start gap-2 text-sm text-[var(--color-charcoal)]/80">
                      <Check size={14} className="mt-0.5 shrink-0 text-[var(--color-gold)]" />
                      {discountLabel(tier.discount_percent)}
                    </li>
                    {hasSubscriberBoost && (
                      <li className="flex items-start gap-2 text-sm text-[var(--color-charcoal)]/80">
                        <Check size={14} className="mt-0.5 shrink-0 text-[var(--color-gold)]" />
                        {tier.subscriber_discount_percent}% off for subscribers
                      </li>
                    )}
                  </>
                )}
                <li className="flex items-start gap-2 text-sm text-[var(--color-charcoal)]/80">
                  <Check size={14} className="mt-0.5 shrink-0 text-[var(--color-gold)]" />
                  Redeem again every time you earn {tier.points_required} more points
                </li>
              </ul>

              {showsSubscriberUpsell && (
                <Link
                  href="/profile#premium"
                  className="text-xs text-[var(--color-burgundy)] underline decoration-[var(--color-burgundy)]/30 underline-offset-2"
                >
                  Go Premium for the bigger discount
                </Link>
              )}

              <button
                type="button"
                onClick={() => setFlipped(false)}
                className="mt-auto flex items-center justify-center gap-1.5 rounded-full py-1.5 text-xs font-medium text-[var(--color-charcoal)]/50 hover:bg-black/5"
              >
                <RotateCcw size={13} strokeWidth={2} />
                Back to Progress
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <CenteredDialog
        open={confirmOption !== null}
        onClose={() => setConfirmOption(null)}
        labelledBy="confirm-redeem-title"
      >
        <div className="flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-gold-pale)]">
            <Gift size={22} className="text-[var(--color-burgundy)]" strokeWidth={1.5} />
          </span>
          <h2 id="confirm-redeem-title" className="font-serif-display mt-4 text-2xl text-[var(--color-charcoal)]">
            Redeem {tier.label}?
          </h2>
          <p className="mt-2 max-w-[32ch] text-sm text-[var(--color-charcoal)]/65">
            This uses {tier.points_required} points and shows your code right away — have your
            phone ready to show the register. This can&rsquo;t be undone.
          </p>

          <div className="mt-6 flex w-full flex-col gap-2.5">
            <Button
              fullWidth
              disabled={isPending}
              onClick={() => reveal(confirmOption || undefined)}
            >
              {isPending ? "Redeeming…" : "Yes, Reveal My Code"}
            </Button>
            <Button variant="ghost" fullWidth onClick={() => setConfirmOption(null)}>
              Cancel
            </Button>
          </div>
        </div>
      </CenteredDialog>
    </>
  );
}

function TierHeader({ tier, everUnlocked }: { tier: RewardTier; everUnlocked: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-1.5">
          <p className="font-serif-display text-lg text-[var(--color-charcoal)]">{tier.label}</p>
          {everUnlocked && (
            <span className="flex items-center gap-0.5 rounded-full bg-[var(--color-gold)]/15 px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-[var(--color-gold)]">
              <Check size={11} strokeWidth={3} />
              Unlocked
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-[var(--color-charcoal)]/55">
          {tier.points_required} points to redeem
        </p>
      </div>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-gold)]/15 text-[var(--color-gold)]">
        <Gift size={18} />
      </div>
    </div>
  );
}
