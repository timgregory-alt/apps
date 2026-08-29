"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Lock } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { WineTastingRow } from "@/components/tasting/WineTastingRow";
import { CustomWineRow } from "@/components/tasting/CustomWineRow";
import { AddWineCard } from "@/components/tasting/AddWineCard";
import { STYLE_BADGE } from "@/lib/recommendations";
import { cn } from "@/lib/utils";
import type { CustomWineTasting, WineStyle, WineWithTasting } from "@/lib/types";

const STYLE_ORDER: WineStyle[] = ["red", "white", "rose", "sparkling", "sweet", "mead"];

const NOT_CHECKED_IN_MESSAGE = "Check in at this winery to start rating its wines.";

/** The interactive "rate these wines" list — reused on winery pages and, in
 * summary form, could be dropped anywhere else a tasting flight is shown. */
export function WineTastingList({
  initialWines,
  initialCustomTastings = [],
  wineryId,
  isLoggedIn,
  isCheckedIn = true,
  redirectTo,
  showProgress = true,
  allowCustom = true,
}: {
  initialWines: WineWithTasting[];
  initialCustomTastings?: CustomWineTasting[];
  wineryId: string;
  isLoggedIn: boolean;
  /** Ratings and custom-wine logging are gated behind a real GPS check-in —
   * without one, the list is still browsable but rating is locked. */
  isCheckedIn?: boolean;
  redirectTo: string;
  showProgress?: boolean;
  allowCustom?: boolean;
}) {
  const router = useRouter();
  const [wines, setWines] = useState(initialWines);
  const [customTastings, setCustomTastings] = useState(initialCustomTastings);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeStyle, setActiveStyle] = useState<WineStyle | "all">("all");

  const tastedCount = wines.filter((w) => w.tasting != null).length;

  const availableStyles = useMemo(
    () => STYLE_ORDER.filter((style) => wines.some((w) => w.style === style)),
    [wines]
  );
  const showFilters = wines.length > 4;

  const filteredWines = useMemo(() => {
    const q = query.trim().toLowerCase();
    return wines.filter((w) => {
      if (activeStyle !== "all" && w.style !== activeStyle) return false;
      if (
        q &&
        !w.name.toLowerCase().includes(q) &&
        !w.varietal.toLowerCase().includes(q) &&
        !w.tasting_notes.toLowerCase().includes(q) &&
        !(w.food_pairing?.toLowerCase().includes(q) ?? false)
      ) {
        return false;
      }
      return true;
    });
  }, [wines, query, activeStyle]);

  function requireLogin() {
    router.push(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  async function handleRate(wineId: string, rating: number) {
    if (!isLoggedIn) return requireLogin();
    if (!isCheckedIn) {
      setError(NOT_CHECKED_IN_MESSAGE);
      return;
    }

    setError(null);
    const previousTasting = wines.find((w) => w.id === wineId)?.tasting ?? null;
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
      const res = await fetch("/api/wine-tasting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wineId, rating }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Could not save your rating.");
        setWines((prev) => prev.map((w) => (w.id === wineId ? { ...w, tasting: previousTasting } : w)));
      }
    } catch {
      setError("Could not save your rating. Please try again.");
      setWines((prev) => prev.map((w) => (w.id === wineId ? { ...w, tasting: previousTasting } : w)));
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
    if (!isCheckedIn) {
      setError(NOT_CHECKED_IN_MESSAGE);
      return;
    }

    setError(null);
    const res = await fetch("/api/custom-wine-tasting", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wineryId, ...input }),
    });
    const data = await res.json().catch(() => null);
    if (data?.tasting) {
      setCustomTastings((prev) => [...prev, data.tasting]);
    } else {
      setError(data?.error ?? "Could not save that wine.");
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
      {isLoggedIn && !isCheckedIn && (
        <div className="flex items-center gap-2 rounded-2xl bg-black/[0.03] px-4 py-3 text-xs text-[var(--color-charcoal)]/60">
          <Lock size={14} className="shrink-0 text-[var(--color-charcoal)]/40" strokeWidth={2} />
          {NOT_CHECKED_IN_MESSAGE}
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-[var(--color-burgundy)]">
          {error}
        </p>
      )}
      {showProgress && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-charcoal)]/45">
            {tastedCount} of {wines.length} wines tasted
          </p>
          <ProgressBar value={tastedCount} max={wines.length} />
        </div>
      )}

      {showFilters && (
        <div className="flex flex-col gap-2.5">
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-charcoal)]/35"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by taste, pairing, name…"
              className="w-full rounded-full border border-[var(--color-line)] bg-white/70 py-2 pl-9 pr-3 text-sm text-[var(--color-charcoal)] outline-none focus:border-[var(--color-gold)]"
            />
          </div>

          {availableStyles.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto pb-0.5">
              {(["all", ...availableStyles] as const).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setActiveStyle(style)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1 text-xs font-medium tracking-wide transition-colors",
                    activeStyle === style
                      ? "bg-[var(--color-burgundy)] text-[var(--color-ivory)]"
                      : "bg-black/5 text-[var(--color-charcoal)]/60 hover:bg-black/10"
                  )}
                >
                  {style === "all" ? "All" : STYLE_BADGE[style]}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {filteredWines.length === 0 && showFilters && (
          <p className="py-4 text-center text-sm text-[var(--color-charcoal)]/45">
            No wines match your search.
          </p>
        )}
        {filteredWines.map((wine) => (
          <WineTastingRow
            key={wine.id}
            wine={wine}
            pending={pendingId === wine.id}
            locked={isLoggedIn && !isCheckedIn}
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
        <AddWineCard
          isLoggedIn={isLoggedIn}
          locked={isLoggedIn && !isCheckedIn}
          redirectTo={redirectTo}
          onAdd={handleAddCustom}
        />
      )}
    </div>
  );
}
