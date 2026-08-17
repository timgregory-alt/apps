import Link from "next/link";
import { WineryImage } from "@/components/winery/WineryImage";
import { PassportStamp } from "@/components/passport/PassportStamp";
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

export function PassportEntry({
  winery,
  tastingProgress,
}: {
  winery: WineryWithStatus;
  tastingProgress?: WineryTastingProgress;
}) {
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
          {winery.checkin && (
            <p className="mt-1.5 text-xs text-[var(--color-charcoal)]/50">
              Visited {formatCheckinDate(winery.checkin.checkin_date)}
            </p>
          )}
          {tastingProgress && tastingProgress.total > 0 && (
            <div className="mt-1.5">
              <WineryTastingGlass
                tried={tastingProgress.tried}
                total={tastingProgress.total}
                size={16}
                layout="inline"
              />
            </div>
          )}
        </div>

        <PassportStamp name={winery.name} city={winery.city} status={winery.status} size="sm" />
      </Link>
    </Card>
  );
}
