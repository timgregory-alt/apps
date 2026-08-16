"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { WineTastingRow } from "@/components/tasting/WineTastingRow";
import type { WineWithTasting } from "@/lib/types";

/** The interactive "rate these wines" list — reused on winery pages and, in
 * summary form, could be dropped anywhere else a tasting flight is shown. */
export function WineTastingList({
  initialWines,
  isLoggedIn,
  redirectTo,
  showProgress = true,
  onChange,
}: {
  initialWines: WineWithTasting[];
  isLoggedIn: boolean;
  redirectTo: string;
  showProgress?: boolean;
  onChange?: (wines: WineWithTasting[]) => void;
}) {
  const router = useRouter();
  const [wines, setWines] = useState(initialWines);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const tastedCount = wines.filter((w) => w.tasting != null).length;

  async function handleRate(wineId: string, liked: boolean) {
    if (!isLoggedIn) {
      router.push(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
      return;
    }

    setPendingId(wineId);
    setWines((prev) => {
      const next = prev.map((w) =>
        w.id === wineId
          ? {
              ...w,
              tasting: {
                id: w.tasting?.id ?? `local-${wineId}`,
                user_id: "",
                wine_id: wineId,
                liked,
                created_at: new Date().toISOString(),
              },
            }
          : w
      );
      onChange?.(next);
      return next;
    });

    try {
      await fetch("/api/wine-tasting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wineId, liked }),
      });
    } catch {
      // Optimistic update stays even if the network call fails silently —
      // worst case the rating doesn't persist to the next page load.
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {showProgress && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-charcoal)]/45">
            {tastedCount} of {wines.length} wines tasted
          </p>
          <ProgressBar value={tastedCount} max={wines.length} />
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {wines.map((wine) => (
          <WineTastingRow
            key={wine.id}
            wine={wine}
            pending={pendingId === wine.id}
            onRate={(liked) => handleRate(wine.id, liked)}
          />
        ))}
      </div>
    </div>
  );
}
