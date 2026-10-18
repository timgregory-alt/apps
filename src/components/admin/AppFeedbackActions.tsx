"use client";

import { useState, useTransition } from "react";
import { Archive, Trash2 } from "lucide-react";
import { archiveAppFeedbackAction, deleteAppFeedbackAction } from "@/app/admin/actions";

export function AppFeedbackActions({ id }: { id: string }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function archive() {
    setError(null);
    startTransition(async () => {
      const result = await archiveAppFeedbackAction(id);
      if (result?.error) setError(result.error);
    });
  }

  function remove() {
    setError(null);
    startTransition(async () => {
      const result = await deleteAppFeedbackAction(id);
      if (result?.error) {
        setError(result.error);
        setConfirmingDelete(false);
      }
    });
  }

  if (confirmingDelete) {
    return (
      <div className="flex shrink-0 items-center gap-1.5">
        <span className="text-xs text-[var(--color-charcoal)]/55">Delete?</span>
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="rounded-full bg-[var(--color-burgundy)] px-2.5 py-1 text-xs font-medium text-white disabled:opacity-60"
        >
          {pending ? "Deleting…" : "Confirm"}
        </button>
        <button
          type="button"
          onClick={() => setConfirmingDelete(false)}
          disabled={pending}
          className="rounded-full border border-[var(--color-line)] px-2.5 py-1 text-xs font-medium text-[var(--color-charcoal)]/60"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={archive}
          disabled={pending}
          aria-label="Archive feedback"
          className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--color-charcoal)]/40 hover:bg-black/5 hover:text-[var(--color-charcoal)]/70 disabled:opacity-60"
        >
          <Archive size={14} strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={() => setConfirmingDelete(true)}
          disabled={pending}
          aria-label="Delete feedback"
          className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--color-charcoal)]/40 hover:bg-[var(--color-burgundy)]/10 hover:text-[var(--color-burgundy)] disabled:opacity-60"
        >
          <Trash2 size={14} strokeWidth={2} />
        </button>
      </div>
      {error && <p className="text-xs text-[var(--color-burgundy)]">{error}</p>}
    </div>
  );
}
