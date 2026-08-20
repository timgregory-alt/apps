"use client";

import { useState, useTransition } from "react";
import { syncEventsNowAction } from "@/app/admin/wineries/actions";
import type { EventSyncResult } from "@/lib/event-sync";

export function EventSyncPanel({
  wineryId,
  eventsPageUrl,
  websiteUrl,
}: {
  wineryId: string;
  eventsPageUrl: string | null;
  websiteUrl: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<EventSyncResult | null>(null);

  const sourceUrl = eventsPageUrl ?? websiteUrl;

  function handleSync() {
    setResult(null);
    startTransition(async () => {
      const res = await syncEventsNowAction(wineryId);
      setResult(res);
    });
  }

  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
      <p className="text-sm font-medium text-[var(--color-charcoal)]">Events Sync</p>
      <p className="mt-1 text-xs text-[var(--color-charcoal)]/55">
        This runs automatically every week. Use this button to check right now instead of
        waiting.
      </p>

      {!sourceUrl && (
        <p className="mt-3 text-xs text-[var(--color-burgundy)]">
          No website or events page URL set for this winery yet — add one above first.
        </p>
      )}

      <button
        type="button"
        onClick={handleSync}
        disabled={pending || !sourceUrl}
        className="mt-4 h-10 w-full rounded-full bg-[var(--color-charcoal)] text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Checking…" : "Check for New Events Now"}
      </button>

      {result && (
        <div className="mt-3 rounded-xl bg-[var(--color-gold-pale)]/25 p-3 text-sm text-[var(--color-charcoal)]">
          {result.status === "error" ? (
            <p className="text-[var(--color-burgundy)]">Couldn&rsquo;t check: {result.detail}</p>
          ) : result.added > 0 ? (
            <p>
              Added {result.added} new {result.added === 1 ? "event" : "events"}: {result.detail}
            </p>
          ) : (
            <p>No new events found — the list already matches what&rsquo;s on the site.</p>
          )}
        </div>
      )}
    </div>
  );
}
