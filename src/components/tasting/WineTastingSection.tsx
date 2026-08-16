"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SectionEyebrow } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { WineTastingRow } from "@/components/tasting/WineTastingRow";
import { RecommendationsPanel } from "@/components/tasting/RecommendationsPanel";
import { computeRecommendations } from "@/lib/recommendations";
import type { WineWithTasting, WineryWithStatus } from "@/lib/types";

export function WineTastingSection({
  initialWines,
  wineries,
  isLoggedIn,
}: {
  initialWines: WineWithTasting[];
  wineries: WineryWithStatus[];
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [wines, setWines] = useState(initialWines);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const tastedCount = wines.filter((w) => w.tasting != null).length;
  const recommendations = useMemo(
    () => computeRecommendations(wines, wineries),
    [wines, wineries]
  );

  async function handleRate(wineId: string, liked: boolean) {
    if (!isLoggedIn) {
      router.push("/login?redirectTo=/passport");
      return;
    }

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
                liked,
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
    <section className="flex flex-col gap-4">
      <div>
        <SectionEyebrow>Wine Tasting</SectionEyebrow>
        <p className="font-serif-display mt-1 text-2xl text-[var(--color-charcoal)]">
          What&rsquo;s Your Taste?
        </p>
        <p className="mt-1 text-sm text-[var(--color-charcoal)]/60">
          Rate a few wines from the trail and we&rsquo;ll recommend what — and where — to try next.
        </p>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-charcoal)]/45">
          {tastedCount} of {wines.length} wines tasted
        </p>
        <ProgressBar value={tastedCount} max={wines.length} />
      </div>

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

      {recommendations.topStyles.length > 0 && (
        <div className="mt-2 rounded-3xl border border-[var(--color-gold)]/30 bg-[var(--color-gold-pale)]/20 p-5">
          <RecommendationsPanel recommendations={recommendations} />
        </div>
      )}
    </section>
  );
}
