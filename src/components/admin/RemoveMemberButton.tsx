"use client";

import { useState, useTransition } from "react";
import { removeMemberAction } from "@/app/admin/members/actions";

export function RemoveMemberButton({ userId, name }: { userId: string; name: string }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function remove() {
    setError(null);
    startTransition(async () => {
      const result = await removeMemberAction(userId);
      if (result?.error) {
        setError(result.error);
        setConfirming(false);
      }
    });
  }

  if (confirming) {
    return (
      <div className="flex shrink-0 items-center gap-1.5">
        <span className="text-xs text-[var(--color-charcoal)]/55">Remove {name}?</span>
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="rounded-full bg-[var(--color-burgundy)] px-3 py-1 text-xs font-medium text-white disabled:opacity-60"
        >
          {pending ? "Removing…" : "Confirm"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs font-medium text-[var(--color-charcoal)]/60"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-full px-3 py-1 text-xs font-medium text-[var(--color-charcoal)]/45 hover:bg-[var(--color-burgundy)]/10 hover:text-[var(--color-burgundy)]"
      >
        Remove
      </button>
      {error && <p className="text-xs text-[var(--color-burgundy)]">{error}</p>}
    </div>
  );
}
