import Link from "next/link";
import { WineryImage } from "@/components/winery/WineryImage";
import { WineryVisitedStamp } from "@/components/winery/WineryVisitedStamp";
import type { WineryWithStatus } from "@/lib/types";

export function WineryHero({ winery }: { winery: WineryWithStatus }) {
  const visited = winery.status !== "not_visited";

  return (
    <div className="relative h-[52vh] min-h-80 w-full overflow-hidden">
      <WineryImage name={winery.name} slug={winery.slug} src={winery.hero_image} />
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-charcoal)]/85 via-[var(--color-charcoal)]/10 to-[var(--color-charcoal)]/40" />

      <Link
        href="/map"
        aria-label="Back to trail map"
        className="absolute left-5 top-[calc(env(safe-area-inset-top)+1rem)] flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[var(--color-charcoal)] shadow-md backdrop-blur-sm transition-transform active:scale-95"
      >
        ←
      </Link>

      <div className="absolute right-5 top-[calc(env(safe-area-inset-top)+1rem)] drop-shadow-md">
        <WineryVisitedStamp visited={visited} />
      </div>

      <div className="absolute inset-x-0 bottom-0 px-6 pb-7">
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.28em] text-[var(--color-gold-pale)]">
          {winery.city}, {winery.state}
        </p>
        <h1 className="font-serif-display mt-1 text-[2.1rem] leading-[1.05] text-white drop-shadow-sm">
          {winery.name}
        </h1>
      </div>
    </div>
  );
}
