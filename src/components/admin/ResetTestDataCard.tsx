"use client";

import { useState, useTransition } from "react";
import { RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CenteredDialog } from "@/components/ui/CenteredDialog";
import { resetMyRewardsTestDataAction } from "@/app/admin/rewards/actions";

/** Wipes every check-in, wine rating, trail completion, and redemption on
 * the signed-in admin's own account, so points recompute to 0 and no tier
 * shows as unlocked — for testing flows like the tier celebration without
 * needing to touch the database by hand. */
export function ResetTestDataCard() {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function clearTierCelebrationMemory() {
    try {
      Object.keys(localStorage)
        .filter((key) => key.startsWith("twt-highest-tier-"))
        .forEach((key) => localStorage.removeItem(key));
    } catch {
      // Best-effort — worst case a stale tier-celebration flag lingers.
    }
  }

  function handleReset() {
    setConfirming(false);
    setError(null);
    startTransition(async () => {
      const result = await resetMyRewardsTestDataAction();
      if ("error" in result) {
        setError(result.error);
        return;
      }
      clearTierCelebrationMemory();
      setDone(true);
    });
  }

  return (
    <Card className="flex flex-col gap-3 border-[var(--color-burgundy)]/25 p-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-burgundy)]">
          Testing Tools
        </p>
        <p className="mt-1 text-sm text-[var(--color-charcoal)]/70">
          Reset your own admin account back to 0 points and no unlocked tier — clears your
          check-ins, wine ratings, trail completion, and redemptions so you can re-test the
          rewards flow from scratch. This only ever affects your own account.
        </p>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => setConfirming(true)}
        disabled={isPending}
      >
        <RotateCcw size={14} strokeWidth={2} />
        Reset My Test Data
      </Button>

      {done && (
        <p className="text-xs text-[var(--color-charcoal)]/60">
          Done — your account is back to 0 points. Check in again to start earning.
        </p>
      )}
      {error && <p className="text-xs text-[var(--color-burgundy)]">{error}</p>}

      <CenteredDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        labelledBy="reset-test-data-title"
      >
        <div className="flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-gold-pale)]">
            <RotateCcw size={20} className="text-[var(--color-burgundy)]" strokeWidth={1.5} />
          </span>
          <h2
            id="reset-test-data-title"
            className="font-serif-display mt-4 text-2xl text-[var(--color-charcoal)]"
          >
            Reset Your Account to 0 Points?
          </h2>
          <p className="mt-2 max-w-[32ch] text-sm text-[var(--color-charcoal)]/65">
            This permanently deletes all of your check-ins, wine ratings, trail completion, and
            redemptions. This can&rsquo;t be undone.
          </p>
          <div className="mt-6 flex w-full flex-col gap-2.5">
            <Button fullWidth disabled={isPending} onClick={handleReset}>
              {isPending ? "Resetting…" : "Yes, Reset to 0"}
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
