import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getCurrentUser, getWineriesWithStatus } from "@/lib/data";
import { recommendNextStop, visitedCount, isTrailComplete } from "@/lib/trail";
import { LinkButton } from "@/components/ui/Button";
import { SectionEyebrow } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { PassportStamp } from "@/components/passport/PassportStamp";
import { MiniTrailMap } from "@/components/map/MiniTrailMap";

export default async function HomePage() {
  const user = await getCurrentUser();
  const wineries = await getWineriesWithStatus(user?.id ?? null);
  const visited = visitedCount(wineries);
  const complete = isTrailComplete(wineries);
  const nextStop = recommendNextStop(wineries);

  const continueHref = !user
    ? "/signup"
    : complete
      ? "/passport"
      : nextStop
        ? `/winery/${nextStop.winery.slug}`
        : "/passport";

  const continueLabel = !user
    ? "Begin Your Journey"
    : complete
      ? "View Your Passport"
      : "Continue Your Journey";

  return (
    <main className="mx-auto flex max-w-md flex-col gap-10 px-6 pb-10 pt-[calc(env(safe-area-inset-top)+3rem)]">
      <section className="flex flex-col items-center text-center">
        <SectionEyebrow>Middle Tennessee · Founding Trail</SectionEyebrow>
        <h1 className="font-serif-display mt-3 text-[2.6rem] leading-[1.05] tracking-tight text-[var(--color-burgundy)]">
          Tennessee
          <br />
          Wine Passport
        </h1>
        <p className="mt-4 max-w-[26ch] text-[1.05rem] text-[var(--color-charcoal)]/70">
          Four wineries. One Tennessee wine adventure.
        </p>
      </section>

      <section aria-label="Your progress" className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <p className="font-serif-display text-lg text-[var(--color-charcoal)]">
            {visited} of {wineries.length} wineries visited
          </p>
          {complete && (
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-gold)]">
              Complete
            </span>
          )}
        </div>
        <ProgressBar value={visited} max={wineries.length} />
      </section>

      <section aria-label="Passport stamps" className="grid grid-cols-2 gap-x-2 gap-y-6 place-items-center">
        {wineries.map((w) => (
          <Link
            key={w.id}
            href={`/winery/${w.slug}`}
            className="flex flex-col items-center gap-2 rounded-2xl p-1 transition-transform active:scale-95"
            aria-label={`${w.name}, ${w.status === "not_visited" ? "not yet visited" : "visited"}`}
          >
            <PassportStamp name={w.name} city={w.city} status={w.status} size="sm" />
            <span className="max-w-[9rem] text-center text-xs font-medium text-[var(--color-charcoal)]/70">
              {w.name}
            </span>
          </Link>
        ))}
      </section>

      <LinkButton href={continueHref} size="lg" fullWidth className="group">
        {continueLabel}
        <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
      </LinkButton>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="font-serif-display text-lg text-[var(--color-charcoal)]">The Wine Trail</p>
          <Link href="/map" className="text-sm text-[var(--color-burgundy)] hover:underline">
            Full map
          </Link>
        </div>
        <MiniTrailMap wineries={wineries} />
      </section>
    </main>
  );
}
