"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { WineTastingRow } from "@/components/tasting/WineTastingRow";
import { CustomWineRow } from "@/components/tasting/CustomWineRow";
import { AddWineCard } from "@/components/tasting/AddWineCard";
import { STYLE_BADGE } from "@/lib/recommendations";
import { cn } from "@/lib/utils";
import type { CustomWineTasting, WineStyle, WineWithTasting } from "@/lib/types";

const STYLE_ORDER: WineStyle[] = ["red", "white", "rose", "sparkling", "sweet", "mead"];

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
      if (q && !w.name.toLowerCase().includes(q) && !w.varietal.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [wines, query, activeStyle]);

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
              placeholder="Search wines…"
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
