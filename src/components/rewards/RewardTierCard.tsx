"use client";

import { useState, useTransition } from "react";
import { Gift, Check } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { generateRedemptionAction } from "@/app/rewards/actions";
import { RedemptionCodeDisplay } from "@/components/rewards/RedemptionCodeDisplay";
import type { RewardRedemption, RewardTier } from "@/lib/types";

export function RewardTierCard({
  tier,
  balance,
  lifetimeTotal,
  redemption,
}: {
  tier: RewardTier;
  /** Currently spendable — lifetime points minus points already redeemed. */
  balance: number;
  /** Lifetime points earned, for the permanent "unlocked" status badge —
   * never decreases, so a tier stays marked as reached even after its
   * points have been spent. */
  lifetimeTotal: number;
  /** The guest's current pending (unredeemed) code for this tier, if any. */
  redemption: RewardRedemption | null;
}) {
  const [code, setCode] = useState(redemption);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const everUnlocked = lifetimeTotal >= tier.points_required;
  const canRedeemNow = balance >= tier.points_required;
  const isChoiceTier = !!tier.choice_options && tier.choice_options.length > 0;

  function reveal(option?: string) {
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
    <Card className="flex flex-col gap-3 p-5">
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

      {!code && (
        <>
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
                    onClick={() => reveal(option)}
                    disabled={isPending}
                  >
                    {isPending ? "Generating…" : option}
                  </Button>
                ))}
              </div>
            ) : (
              <>
                <p className="text-sm text-[var(--color-charcoal)]/70">
                  {tier.discount_percent}% off your next purchase
                </p>
                <Button onClick={() => reveal()} disabled={isPending} size="sm">
                  {isPending ? "Generating…" : `Redeem for ${tier.points_required} pts`}
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
        </>
      )}

      {code && (
        <div className="flex flex-col items-center gap-3 border-t border-[var(--color-line)] pt-4">
          <p className="text-sm font-medium text-[var(--color-charcoal)]">
            {code.chosen_option ?? `${tier.discount_percent}% off your next purchase`}
          </p>
          <RedemptionCodeDisplay redemption={code} />
        </div>
      )}
    </Card>
  );
}
