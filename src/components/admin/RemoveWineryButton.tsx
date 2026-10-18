"use client";

import { useState, useTransition } from "react";
import {
  removeWineryAction,
  restoreWineryAction,
  deleteWineryPermanentlyAction,
} from "@/app/admin/wineries/actions";

/** Toggles a winery between active (visible to guests) and removed
 * (hidden, but its check-in history and data stay intact) — click stops
 * the parent list-row Link from navigating into the edit page. Once
 * inactive, a separate "Delete" offers a real, unrecoverable delete as a
 * deliberate second step past the reversible "Remove". */
export function RemoveWineryButton({ wineryId, active, name }: { wineryId: string; active: boolean; name: string }) {
  const [confirming, setConfirming] = useState<"remove" | "delete" | null>(null);
  const [pending, startTransition] = useTransition();

  function stopNav(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function remove(e: React.MouseEvent) {
    stopNav(e);
    startTransition(async () => {
      await removeWineryAction(wineryId);
      setConfirming(null);
    });
  }

  function restore(e: React.MouseEvent) {
    stopNav(e);
    startTransition(async () => {
      await restoreWineryAction(wineryId);
      setConfirming(null);
    });
  }

  function deletePermanently(e: React.MouseEvent) {
    stopNav(e);
    startTransition(async () => {
      await deleteWineryPermanentlyAction(wineryId);
      setConfirming(null);
    });
  }

  if (confirming === "remove") {
    return (
      <div className="flex shrink-0 items-center gap-1.5" onClick={stopNav}>
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
          onClick={(e) => {
            stopNav(e);
            setConfirming(null);
          }}
          className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs font-medium text-[var(--color-charcoal)]/60"
        >
          Cancel
        </button>
      </div>
    );
  }

  if (confirming === "delete") {
    return (
      <div className="flex shrink-0 items-center gap-1.5" onClick={stopNav}>
        <span className="text-xs text-[var(--color-charcoal)]/55">
          Permanently delete {name}? This can&rsquo;t be undone.
        </span>
        <button
          type="button"
          onClick={deletePermanently}
          disabled={pending}
          className="rounded-full bg-[var(--color-burgundy)] px-3 py-1 text-xs font-medium text-white disabled:opacity-60"
        >
          {pending ? "Deleting…" : "Confirm"}
        </button>
        <button
          type="button"
          onClick={(e) => {
            stopNav(e);
            setConfirming(null);
          }}
          className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs font-medium text-[var(--color-charcoal)]/60"
        >
          Cancel
        </button>
      </div>
    );
  }

  if (active) {
    return (
      <button
        type="button"
        onClick={(e) => {
          stopNav(e);
          setConfirming("remove");
        }}
        disabled={pending}
        className="shrink-0 rounded-full px-3 py-1 text-xs font-medium text-[var(--color-charcoal)]/45 hover:bg-black/5 hover:text-[var(--color-burgundy)] disabled:opacity-60"
      >
        Remove
      </button>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={restore}
        disabled={pending}
        className="rounded-full px-3 py-1 text-xs font-medium text-[var(--color-charcoal)]/45 hover:bg-black/5 hover:text-[var(--color-burgundy)] disabled:opacity-60"
      >
        {pending ? "Restoring…" : "Restore"}
      </button>
      <button
        type="button"
        onClick={(e) => {
          stopNav(e);
          setConfirming("delete");
        }}
        disabled={pending}
        className="rounded-full px-3 py-1 text-xs font-medium text-[var(--color-charcoal)]/45 hover:bg-[var(--color-burgundy)]/10 hover:text-[var(--color-burgundy)] disabled:opacity-60"
      >
        Delete
      </button>
    </div>
  );
}
