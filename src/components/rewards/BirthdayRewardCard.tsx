"use client";

import { useState, useTransition } from "react";
import { PartyPopper } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CenteredDialog } from "@/components/ui/CenteredDialog";
import { generateRedemptionAction } from "@/app/rewards/actions";
import { RedemptionCodeDisplay } from "@/components/rewards/RedemptionCodeDisplay";
import { effectiveDiscountPercent } from "@/lib/rewards";
import type { RewardRedemption, RewardTier } from "@/lib/types";

/** A surprise, not part of the regular points ladder — only rendered by the
 * rewards page when it's actually the guest's birthday. */
export function BirthdayRewardCard({
  tier,
  redemption,
  isSubscriber,
}: {
  tier: RewardTier;
  redemption: RewardRedemption | null;
  isSubscriber: boolean;
}) {
  const [code, setCode] = useState(redemption);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const percent = effectiveDiscountPercent(tier, isSubscriber);

  function reveal() {
    setConfirming(false);
    setError(null);
    startTransition(async () => {
      const result = await generateRedemptionAction(tier.id);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setCode(result);
    });
  }

  return (
    <Card className="texture-grain flex flex-col items-center gap-3 border-[var(--color-gold)]/40 bg-[var(--color-gold-pale)]/30 p-6 text-center">
      <PartyPopper size={24} className="text-[var(--color-gold)]" />
      <p className="font-serif-display text-xl text-[var(--color-charcoal)]">Happy Birthday!</p>
      <p className="text-sm text-[var(--color-charcoal)]/70">
        Enjoy {percent}% off food & merch today, on us.
      </p>

      {!code ? (
        <>
          <Button onClick={() => setConfirming(true)} disabled={isPending} size="sm">
            Reveal My Code
          </Button>
          {error && <p className="text-xs text-[var(--color-burgundy)]">{error}</p>}
        </>
      ) : (
        <div className="border-t border-[var(--color-gold)]/30 pt-4">
          <RedemptionCodeDisplay redemption={code} />
        </div>
      )}

      <CenteredDialog open={confirming} onClose={() => setConfirming(false)} labelledBy="confirm-birthday-title">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-gold-pale)]">
            <PartyPopper size={22} className="text-[var(--color-burgundy)]" strokeWidth={1.5} />
          </span>
          <h2 id="confirm-birthday-title" className="font-serif-display mt-4 text-2xl text-[var(--color-charcoal)]">
            Reveal Your Birthday Reward?
          </h2>
          <p className="mt-2 max-w-[32ch] text-sm text-[var(--color-charcoal)]/65">
            This is your one birthday reward for the year — have your phone ready to show the
            register once you reveal it.
          </p>

          <div className="mt-6 flex w-full flex-col gap-2.5">
            <Button fullWidth disabled={isPending} onClick={reveal}>
              {isPending ? "Revealing…" : "Yes, Reveal My Code"}
            </Button>
            <Button variant="ghost" fullWidth onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </CenteredDialog>
    </Card>
  );
}
