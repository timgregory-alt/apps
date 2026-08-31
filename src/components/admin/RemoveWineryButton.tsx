"use client";

import { useState, useTransition } from "react";
import { removeWineryAction, restoreWineryAction } from "@/app/admin/wineries/actions";

/** Toggles a winery between active (visible to guests) and removed
 * (hidden, but its check-in history and data stay intact) — click stops
 * the parent list-row Link from navigating into the edit page. */
export function RemoveWineryButton({ wineryId, active, name }: { wineryId: string; active: boolean; name: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function stopNav(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function toggle(e: React.MouseEvent) {
    stopNav(e);
    startTransition(async () => {
      await (active ? removeWineryAction(wineryId) : restoreWineryAction(wineryId));
      setConfirming(false);
    });
  }

  if (active && confirming) {
    return (
      <div className="flex shrink-0 items-center gap-1.5" onClick={stopNav}>
        <span className="text-xs text-[var(--color-charcoal)]/55">Remove {name}?</span>
        <button
          type="button"
          onClick={toggle}
          disabled={pending}
          className="rounded-full bg-[var(--color-burgundy)] px-3 py-1 text-xs font-medium text-white disabled:opacity-60"
        >
          {pending ? "Removing…" : "Confirm"}
        </button>
        <button
          type="button"
          onClick={(e) => {
            stopNav(e);
            setConfirming(false);
          }}
          className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs font-medium text-[var(--color-charcoal)]/60"
        >
          Cancel
        </button>
      </div>
    );
  }

  function handleClick(e: React.MouseEvent) {
    if (active) {
      stopNav(e);
      setConfirming(true);
    } else {
      toggle(e);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="shrink-0 rounded-full px-3 py-1 text-xs font-medium text-[var(--color-charcoal)]/45 hover:bg-black/5 hover:text-[var(--color-burgundy)] disabled:opacity-60"
    >
      {pending ? "Restoring…" : active ? "Remove" : "Restore"}
    </button>
  );
}
