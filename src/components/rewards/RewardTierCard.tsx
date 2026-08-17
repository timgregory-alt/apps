"use client";

import { useState, useTransition } from "react";
import { Gift, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { QrCode } from "@/components/ui/QrCode";
import { generateRedemptionAction } from "@/app/rewards/actions";
import type { RewardRedemption, RewardTier } from "@/lib/types";

export function RewardTierCard({
  tier,
  pointsTotal,
  redemption,
}: {
  tier: RewardTier;
  pointsTotal: number;
  redemption: RewardRedemption | null;
}) {
  const [code, setCode] = useState(redemption);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const unlocked = pointsTotal >= tier.points_required;

  function reveal() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await generateRedemptionAction(tier.id);
        setCode(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-serif-display text-lg text-[var(--color-charcoal)]">{tier.label}</p>
          <p className="mt-0.5 text-xs text-[var(--color-charcoal)]/55">
            {tier.points_required} points required
          </p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-gold)]/15 text-[var(--color-gold)]">
          <Gift size={18} />
        </div>
      </div>

      {!code && (
        <>
          <ProgressBar value={Math.min(pointsTotal, tier.points_required)} max={tier.points_required} />
          {unlocked ? (
            <Button onClick={reveal} disabled={isPending} size="sm">
              {isPending ? "Generating…" : "Reveal My Code"}
            </Button>
          ) : (
            <p className="text-xs text-[var(--color-charcoal)]/55">
              {tier.points_required - pointsTotal} points to go
            </p>
          )}
          {error && <p className="text-xs text-[var(--color-burgundy)]">{error}</p>}
        </>
      )}

      {code && (
        <div className="flex flex-col items-center gap-3 border-t border-[var(--color-line)] pt-4">
          <div
            className={
              code.status === "redeemed"
                ? "inline-flex items-center gap-1.5 rounded-full bg-black/5 px-3 py-1 text-xs font-medium text-[var(--color-charcoal)]/60"
                : "inline-flex items-center gap-1.5 rounded-full bg-[var(--color-gold)]/15 px-3 py-1 text-xs font-medium text-[var(--color-gold)]"
            }
          >
            {code.status === "redeemed" ? (
              <>
                <CheckCircle2 size={13} /> Redeemed
              </>
            ) : (
              "Ready to redeem"
            )}
          </div>
          <QrCode
            value={`${typeof window !== "undefined" ? window.location.origin : ""}/redeem/${code.code}`}
            size={160}
          />
          <p className="font-mono text-lg tracking-[0.3em] text-[var(--color-charcoal)]">{code.code}</p>
          <p className="text-center text-xs text-[var(--color-charcoal)]/55">
            Show this QR code to winery staff, or give them the code above if they can&apos;t scan it.
          </p>
        </div>
      )}
    </Card>
  );
}
