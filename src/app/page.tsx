import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  getCurrentUser,
  getTrail,
  getWineriesWithStatus,
  getWinesWithTastings,
  getUpcomingEventsByWinery,
} from "@/lib/data";
import { visitedCount } from "@/lib/trail";
import { getWineryTastingProgress } from "@/lib/recommendations";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { WineryImage } from "@/components/winery/WineryImage";
import { WineryTastingGlass } from "@/components/tasting/WineryTastingGlass";
import { TrailMap } from "@/components/map/TrailMap";
import { PassportCoverFrame } from "@/components/ui/PassportCoverFrame";
import { UpcomingEventsSection } from "@/components/events/UpcomingEventsSection";

export default async function HomePage() {
  const user = await getCurrentUser();
  const [trail, wineries, wines, eventGroups] = await Promise.all([
    getTrail(),
    getWineriesWithStatus(user?.id ?? null),
    getWinesWithTastings(user?.id ?? null),
    getUpcomingEventsByWinery(),
  ]);
  const visited = visitedCount(wineries);

  return (
    <main className="mx-auto flex max-w-md flex-col gap-8 pb-10">
      <Header eyebrow="Wine Trails" title="Explore Tennessee Wine Country" />

      <div className="px-6">
        <Card className="texture-grain relative overflow-hidden bg-[var(--color-burgundy)] px-6 py-6 text-[var(--color-ivory)]">
          <PassportCoverFrame />
          <p className="relative text-[0.68rem] font-medium uppercase tracking-[0.24em] text-[var(--color-gold-pale)]">
            {wineries.length} Stops · Middle Tennessee
          </p>
          <p className="font-serif-display relative mt-2 text-2xl leading-tight">{trail.name}</p>
          {trail.description && (
            <p className="relative mt-2 text-sm text-[var(--color-ivory)]/70">{trail.description}</p>
          )}
          <p className="relative mt-4 text-sm font-medium text-[var(--color-gold-pale)]">
            {visited} of {wineries.length} visited
          </p>
        </Card>
      </div>

      <div className="px-6">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-charcoal)]/45">
          More trails coming soon
        </p>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {["Nashville Wine Trail", "Upper Cumberland Wine Trail", "East Tennessee Wine Trail"].map(
            (name) => (
              <div
                key={name}
                className="flex h-20 w-40 shrink-0 items-center justify-center rounded-2xl border border-dashed border-[var(--color-line)] bg-white/40 px-3 text-center text-xs text-[var(--color-charcoal)]/45"
              >
                {name}
              </div>
            )
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 px-6">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-charcoal)]/45">
          All Wineries
        </p>
        {wineries.map((w) => (
          <Link key={w.id} href={`/winery/${w.slug}`}>
            <Card className="flex items-center gap-4 overflow-hidden p-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                <WineryImage name={w.name} slug={w.slug} src={w.hero_image} rows={false} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--color-charcoal)]">{w.name}</p>
                <p className="text-xs text-[var(--color-charcoal)]/55">{w.city}, TN</p>
              </div>
              <WineryTastingGlass {...getWineryTastingProgress(wines, w.id)} size={40} />
              <ArrowRight size={16} className="shrink-0 text-[var(--color-charcoal)]/30" />
            </Card>
          </Link>
        ))}
      </div>

      <UpcomingEventsSection groups={eventGroups} />

      <TrailMap wineries={wineries} />

      <div className="px-6">
        <LinkButton href="/trail/plan" variant="primary" size="lg" fullWidth>
          Plan My Wine Trail
        </LinkButton>
      </div>
    </main>
  );
}
