import Link from "next/link";
import { WineryImage } from "@/components/winery/WineryImage";
import { TrailStamp } from "@/components/my-trail/TrailStamp";
import { WineryTastingGlass } from "@/components/tasting/WineryTastingGlass";
import { Card } from "@/components/ui/Card";
import { formatCheckinDate } from "@/lib/utils";
import type { WineryWithStatus } from "@/lib/types";
import type { WineryTastingProgress } from "@/lib/recommendations";

const STATUS_LABEL: Record<WineryWithStatus["status"], string> = {
  not_visited: "Not Visited",
  visited: "Visited",
  completed: "Completed",
};

export function MyTrailEntry({
  winery,
  tastingProgress,
}: {
  winery: WineryWithStatus;
  tastingProgress?: WineryTastingProgress;
}) {
  const visited = winery.status !== "not_visited";

  return (
    <Card className="overflow-hidden">
      <Link
        href={`/winery/${winery.slug}`}
        className="flex items-center gap-4 p-4"
        aria-label={`${winery.name} — ${STATUS_LABEL[winery.status]}`}
      >
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl">
          <WineryImage name={winery.name} slug={winery.slug} src={winery.hero_image} rows={false} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-serif-display truncate text-lg text-[var(--color-charcoal)]">
            {winery.name}
          </p>
          <p className="text-sm text-[var(--color-charcoal)]/60">{winery.city}, TN</p>
          <div className="mt-1.5 flex items-center gap-2">
            <span
              className={
                visited
                  ? "rounded-full bg-[var(--color-gold-pale)] px-2.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wide text-[var(--color-burgundy-deep)]"
                  : "rounded-full bg-black/5 px-2.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wide text-[var(--color-charcoal)]/50"
              }
            >
              {STATUS_LABEL[winery.status]}
            </span>
            {winery.checkin && (
              <span className="text-xs text-[var(--color-charcoal)]/50">
                {formatCheckinDate(winery.checkin.checkin_date)}
              </span>
            )}
          </div>
          {tastingProgress && tastingProgress.total > 0 && (
            <div className="mt-1.5">
              <WineryTastingGlass
                tried={tastingProgress.tried}
                total={tastingProgress.total}
                size={26}
                layout="inline"
              />
            </div>
          )}
        </div>

        <TrailStamp name={winery.name} city={winery.city} status={winery.status} size="sm" />
      </Link>
    </Card>
  );
}
