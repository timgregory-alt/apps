"use client";

import { useState, useTransition } from "react";
import { syncWineryNowAction } from "@/app/admin/wineries/actions";
import type { SyncResult } from "@/lib/wine-sync";

export function WineSyncPanel({
  wineryId,
  wineMenuUrl,
  websiteUrl,
}: {
  wineryId: string;
  wineMenuUrl: string | null;
  websiteUrl: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sourceUrl = wineMenuUrl ?? websiteUrl;

  function handleSync() {
    setError(null);
    setResult(null);
    startTransition(async () => {
      try {
        const res = await syncWineryNowAction(wineryId);
        setResult(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Sync failed.");
      }
    });
  }

  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
      <p className="text-sm font-medium text-[var(--color-charcoal)]">Wine List Sync</p>
      <p className="mt-1 text-xs text-[var(--color-charcoal)]/55">
        This runs automatically every week. Use this button to check right now instead of
        waiting.
      </p>

      {!sourceUrl && (
        <p className="mt-3 text-xs text-[var(--color-burgundy)]">
          No website or wine list URL set for this winery yet — add one above first.
        </p>
      )}

      <button
        type="button"
        onClick={handleSync}
        disabled={pending || !sourceUrl}
        className="mt-4 h-10 w-full rounded-full bg-[var(--color-charcoal)] text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Checking…" : "Check for New Wines Now"}
      </button>

      {error && <p className="mt-3 text-sm text-[var(--color-burgundy)]">{error}</p>}

      {result && !error && (
        <div className="mt-3 rounded-xl bg-[var(--color-gold-pale)]/25 p-3 text-sm text-[var(--color-charcoal)]">
          {result.status === "error" ? (
            <p className="text-[var(--color-burgundy)]">Couldn&rsquo;t check: {result.detail}</p>
          ) : result.added > 0 ? (
            <p>
              Added {result.added} new {result.added === 1 ? "wine" : "wines"}: {result.detail}
            </p>
          ) : (
            <p>No new wines found — the list already matches what&rsquo;s on the site.</p>
          )}
        </div>
      )}
    </div>
  );
}
