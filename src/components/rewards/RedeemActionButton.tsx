"use client";

import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { markRedeemedAction } from "@/app/redeem/actions";

export function RedeemActionButton({ code }: { code: string }) {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  function redeem() {
    setError(null);
    startTransition(async () => {
      const result = await markRedeemedAction(code);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setDone(true);
    });
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 rounded-full bg-[var(--color-gold)]/15 px-4 py-2 text-sm font-medium text-[var(--color-gold)]">
        <CheckCircle2 size={16} /> Marked as redeemed
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Button onClick={redeem} disabled={isPending}>
        {isPending ? "Redeeming…" : "Mark as Redeemed"}
      </Button>
      {error && <p className="text-xs text-[var(--color-burgundy)]">{error}</p>}
    </div>
  );
}
