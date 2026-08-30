import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  getCurrentUser,
  getProfile,
  getAllTrails,
  getTrailWineries,
  getWineriesWithStatus,
  getWinesWithTastings,
  getUpcomingEventsByWinery,
} from "@/lib/data";
import { DEFAULT_TRAIL_SLUG } from "@/lib/seed-data";
import { visitedCount } from "@/lib/trail";
import { getWineryTastingProgress } from "@/lib/recommendations";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { WineryImage } from "@/components/winery/WineryImage";
import { WineryTastingGlass } from "@/components/tasting/WineryTastingGlass";
import { TrailMap } from "@/components/map/TrailMap";
import { TrailPicker } from "@/components/trail/TrailPicker";
import { TrailCoverFrame } from "@/components/ui/TrailCoverFrame";
import { UpcomingEventsSection } from "@/components/events/UpcomingEventsSection";
import { VineyardVideoBackground } from "@/components/explore/VineyardVideoBackground";
import { AuthModal } from "@/components/auth/AuthModal";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ trail?: string }>;
}) {
  const { trail: trailParam } = await searchParams;
  const user = await getCurrentUser();
  const profile = user ? await getProfile(user.id) : null;
  const trails = await getAllTrails();
  const selectedTrail = trails.find((t) => t.slug === trailParam) ?? trails.find((t) => t.slug === DEFAULT_TRAIL_SLUG);
  const selectedSlug = selectedTrail?.slug ?? DEFAULT_TRAIL_SLUG;

  const [trailWineryLists, wineries, wines, eventGroups] = await Promise.all([
    Promise.all(trails.map((t) => getTrailWineries(t.slug))),
    getWineriesWithStatus(user?.id ?? null, selectedSlug),
    getWinesWithTastings(user?.id ?? null, selectedSlug),
    getUpcomingEventsByWinery(profile?.is_subscriber ?? false, selectedSlug),
  ]);
  const stopCountBySlug = new Map(trails.map((t, i) => [t.slug, trailWineryLists[i].length]));
  const visited = visitedCount(wineries);
  const hasWineries = wineries.length > 0;

  return (
    <>
      <VineyardVideoBackground />
      <main className="relative z-10 mx-auto flex max-w-md flex-col gap-8 pb-10">
        <header className="mx-auto w-full max-w-md px-6 pt-[calc(env(safe-area-inset-top)+1.75rem)] text-center">
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.32em] text-[var(--color-gold)]">
            Wine Trails
          </p>
          <h1 className="font-serif-elegant mt-2 text-[2.75rem] italic leading-[1.05] text-[var(--color-charcoal)] [text-shadow:0_2px_18px_rgba(250,246,238,0.9)]">
            Explore Tennessee
            <br />
            Wine Country
          </h1>
        </header>

      <div className="px-6">
        <Card className="texture-grain relative overflow-hidden bg-[var(--color-burgundy)] px-6 py-6 text-[var(--color-ivory)]">
          <TrailCoverFrame />
          <p className="relative text-[0.68rem] font-medium uppercase tracking-[0.24em] text-[var(--color-gold-pale)]">
            {hasWineries ? `${wineries.length} Stops · Middle Tennessee` : "Middle Tennessee"}
          </p>
          <p className="font-serif-display relative mt-2 text-2xl leading-tight">
            {selectedTrail?.name ?? "Coming Soon"}
          </p>
          {selectedTrail?.description && (
            <p className="relative mt-2 text-sm text-[var(--color-ivory)]/70">{selectedTrail.description}</p>
          )}
          <p className="relative mt-4 text-sm font-medium text-[var(--color-gold-pale)]">
            {hasWineries ? `${visited} of ${wineries.length} visited` : "Wineries coming soon"}
          </p>
        </Card>
      </div>

      <div className="px-6">
        <p className="font-serif-elegant mb-3 text-xl italic text-[var(--color-charcoal)]/80 [text-shadow:0_1px_12px_rgba(250,246,238,0.9)]">
          Trails
        </p>
        <TrailPicker trails={trails} selectedSlug={selectedSlug} stopCountBySlug={stopCountBySlug} basePath="/" />
      </div>

      <div className="flex flex-col gap-3 px-6">
        <p className="font-serif-elegant text-xl italic text-[var(--color-charcoal)] [text-shadow:0_1px_12px_rgba(250,246,238,0.9)]">
          All Wineries
        </p>
        {hasWineries ? (
          wineries.map((w) => (
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
          ))
        ) : (
          <Card className="px-4 py-6 text-center text-sm text-[var(--color-charcoal)]/55">
            {selectedTrail?.name ?? "This trail"} is coming soon — check back for wineries to visit.
          </Card>
        )}
      </div>

      <UpcomingEventsSection groups={eventGroups} />

      <div className="px-6">
        <Link
          href="/vip"
          className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-gold)]/30 bg-[var(--color-gold-pale)]/20 px-5 py-3.5"
        >
          <div>
            <p className="text-sm font-medium text-[var(--color-charcoal)]">VIP Events</p>
            <p className="text-xs text-[var(--color-charcoal)]/55">Premium members get early access</p>
          </div>
          <ArrowRight size={16} className="shrink-0 text-[var(--color-charcoal)]/40" />
        </Link>
      </div>

      {hasWineries && <TrailMap wineries={wineries} />}

      {hasWineries && (
        <div className="px-6">
          <LinkButton href="/trail/plan" variant="primary" size="lg" fullWidth>
            Plan My Wine Trail
          </LinkButton>
        </div>
      )}
      </main>
      {!user && (
        <Suspense>
          <AuthModal />
        </Suspense>
      )}
    </>
  );
}
