import Link from "next/link";
import { Sparkles } from "lucide-react";
import { WineryImage } from "@/components/winery/WineryImage";
import { DirectionsButton } from "@/components/winery/DirectionsButton";
import { LinkButton } from "@/components/ui/Button";
import { STYLE_LABELS } from "@/lib/recommendations";
import type { TastingRecommendations } from "@/lib/recommendations";

export function RecommendationsPanel({ recommendations }: { recommendations: TastingRecommendations }) {
  const { topStyles, wines, wineries } = recommendations;

  if (topStyles.length === 0) return null;

  const styleLabel = topStyles.map((s) => STYLE_LABELS[s]).join(" and ");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-[var(--color-gold)]" strokeWidth={1.75} />
        <p className="font-serif-display text-lg text-[var(--color-charcoal)]">
          Recommended For You
        </p>
      </div>
      <p className="-mt-2 text-sm text-[var(--color-charcoal)]/60">
        Since you like {styleLabel}, here&rsquo;s what to try next.
      </p>

      {wines.length > 0 && (
        <div className="flex flex-col gap-2">
          {wines.slice(0, 4).map(({ wine, winery, reason }) => (
            <div
              key={wine.id}
              className="rounded-2xl border border-[var(--color-line)] bg-white/60 px-4 py-3"
            >
              <p className="text-sm font-medium text-[var(--color-charcoal)]">{wine.name}</p>
              <p className="mt-0.5 text-xs text-[var(--color-charcoal)]/55">
                {winery.name} · {reason}
              </p>
            </div>
          ))}
        </div>
      )}

      {wineries.length > 0 && (
        <div className="flex flex-col gap-3">
          {wineries.slice(0, 2).map(({ winery, reason }) => (
            <div
              key={winery.id}
              className="flex items-center gap-3 overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white/60 p-3"
            >
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                <WineryImage name={winery.name} slug={winery.slug} src={winery.hero_image} rows={false} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--color-charcoal)]">
                  {winery.name}
                </p>
                <p className="text-xs text-[var(--color-charcoal)]/55">{reason}</p>
              </div>
              <div className="flex shrink-0 flex-col gap-1.5">
                <LinkButton href={`/winery/${winery.slug}`} variant="outline" size="sm">
                  View
                </LinkButton>
              </div>
            </div>
          ))}
          {wineries[0] && (
            <DirectionsButton
              lat={wineries[0].winery.latitude}
              lon={wineries[0].winery.longitude}
              label={wineries[0].winery.name}
              variant="primary"
              fullWidth
            />
          )}
        </div>
      )}

      {wines.length === 0 && wineries.length === 0 && (
        <p className="text-sm text-[var(--color-charcoal)]/50">
          You&rsquo;ve rated every wine in this style —{" "}
          <Link href="/map" className="text-[var(--color-burgundy)] hover:underline">
            see the full trail map
          </Link>
          .
        </p>
      )}
    </div>
  );
}
