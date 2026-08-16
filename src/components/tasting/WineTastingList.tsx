"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { WineTastingRow } from "@/components/tasting/WineTastingRow";
import { CustomWineRow } from "@/components/tasting/CustomWineRow";
import { AddWineCard } from "@/components/tasting/AddWineCard";
import type { CustomWineTasting, WineStyle, WineWithTasting } from "@/lib/types";

/** The interactive "rate these wines" list — reused on winery pages and, in
 * summary form, could be dropped anywhere else a tasting flight is shown. */
export function WineTastingList({
  initialWines,
  initialCustomTastings = [],
  wineryId,
  isLoggedIn,
  redirectTo,
  showProgress = true,
  allowCustom = true,
}: {
  initialWines: WineWithTasting[];
  initialCustomTastings?: CustomWineTasting[];
  wineryId: string;
  isLoggedIn: boolean;
  redirectTo: string;
  showProgress?: boolean;
  allowCustom?: boolean;
}) {
  const router = useRouter();
  const [wines, setWines] = useState(initialWines);
  const [customTastings, setCustomTastings] = useState(initialCustomTastings);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const tastedCount = wines.filter((w) => w.tasting != null).length;

  function requireLogin() {
    router.push(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  async function handleRate(wineId: string, rating: number) {
    if (!isLoggedIn) return requireLogin();

    setPendingId(wineId);
    setWines((prev) =>
      prev.map((w) =>
        w.id === wineId
          ? {
              ...w,
              tasting: {
                id: w.tasting?.id ?? `local-${wineId}`,
                user_id: "",
                wine_id: wineId,
                rating,
                created_at: new Date().toISOString(),
              },
            }
          : w
      )
    );

    try {
      await fetch("/api/wine-tasting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wineId, rating }),
      });
    } catch {
      // Optimistic update stays even if the network call fails silently.
    } finally {
      setPendingId(null);
    }
  }

  async function handleAddCustom(input: {
    name: string;
    style: WineStyle;
    notes: string;
    foodPairing: string;
    liked: boolean;
  }) {
    if (!isLoggedIn) return requireLogin();

    const res = await fetch("/api/custom-wine-tasting", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wineryId, ...input }),
    });
    const data = await res.json().catch(() => null);
    if (data?.tasting) {
      setCustomTastings((prev) => [...prev, data.tasting]);
    }
  }

  async function handleDeleteCustom(id: string) {
    setPendingId(id);
    setCustomTastings((prev) => prev.filter((t) => t.id !== id));
    try {
      await fetch("/api/custom-wine-tasting", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {
      // Optimistic removal stays even if the network call fails silently.
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
            onRate={(rating) => handleRate(wine.id, rating)}
          />
        ))}
        {customTastings.map((tasting) => (
          <CustomWineRow
            key={tasting.id}
            tasting={tasting}
            pending={pendingId === tasting.id}
            onDelete={() => handleDeleteCustom(tasting.id)}
          />
        ))}
      </div>

      {allowCustom && (
        <AddWineCard isLoggedIn={isLoggedIn} redirectTo={redirectTo} onAdd={handleAddCustom} />
      )}
    </div>
  );
}
