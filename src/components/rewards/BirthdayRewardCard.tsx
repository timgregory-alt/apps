"use client";

import { useState, useTransition } from "react";
import { PartyPopper } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { generateRedemptionAction } from "@/app/rewards/actions";
import { RedemptionCodeDisplay } from "@/components/rewards/RedemptionCodeDisplay";
import type { RewardRedemption, RewardTier } from "@/lib/types";

/** A surprise, not part of the regular points ladder — only rendered by the
 * rewards page when it's actually the guest's birthday. */
export function BirthdayRewardCard({
  tier,
  redemption,
}: {
  tier: RewardTier;
  redemption: RewardRedemption | null;
}) {
  const [code, setCode] = useState(redemption);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reveal() {
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
        Enjoy {tier.discount_percent}% off today, on us.
      </p>

      {!code ? (
        <>
          <Button onClick={reveal} disabled={isPending} size="sm">
            {isPending ? "Generating…" : "Reveal My Code"}
          </Button>
          {error && <p className="text-xs text-[var(--color-burgundy)]">{error}</p>}
        </>
      ) : (
        <div className="border-t border-[var(--color-gold)]/30 pt-4">
          <RedemptionCodeDisplay redemption={code} />
        </div>
      )}
    </Card>
  );
}
