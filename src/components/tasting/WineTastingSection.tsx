import Link from "next/link";
import { SectionEyebrow } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { RecommendationsPanel } from "@/components/tasting/RecommendationsPanel";
import { computeRecommendations } from "@/lib/recommendations";
import type { WineWithTasting, WineryWithStatus } from "@/lib/types";

/** Passport-page summary: overall tasting progress plus recommendations —
 * the actual "rate this wine" cards live on each winery's own page. */
export function WineTastingSection({
  wines,
  wineries,
}: {
  wines: WineWithTasting[];
  wineries: WineryWithStatus[];
}) {
  const tastedCount = wines.filter((w) => w.tasting != null).length;
  const recommendations = computeRecommendations(wines, wineries);

  return (
    <section className="flex flex-col gap-4">
      <div>
        <SectionEyebrow>Wine Tasting</SectionEyebrow>
        <p className="font-serif-display mt-1 text-2xl text-[var(--color-charcoal)]">
          What&rsquo;s Your Taste?
        </p>
        <p className="mt-1 text-sm text-[var(--color-charcoal)]/60">
          Rate wines on each winery&rsquo;s page and we&rsquo;ll recommend what — and where — to try next.
        </p>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-charcoal)]/45">
          {tastedCount} of {wines.length} wines tasted
        </p>
        <ProgressBar value={tastedCount} max={wines.length} />
      </div>

      {recommendations.topStyles.length > 0 ? (
        <div className="rounded-3xl border border-[var(--color-gold)]/30 bg-[var(--color-gold-pale)]/20 p-5">
          <RecommendationsPanel recommendations={recommendations} />
        </div>
      ) : (
        <p className="text-sm text-[var(--color-charcoal)]/50">
          Visit a{" "}
          <Link href="/map" className="text-[var(--color-burgundy)] hover:underline">
            winery page
          </Link>{" "}
          and rate a wine or two to get personalized recommendations here.
        </p>
      )}
    </section>
  );
}
