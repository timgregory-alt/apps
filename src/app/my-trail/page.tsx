import { Suspense } from "react";
import {
  getCurrentUser,
  getAllTrails,
  getTrailWineries,
  getWineriesWithStatus,
  getWinesWithTastings,
  getCustomWineTastings,
} from "@/lib/data";
import { DEFAULT_TRAIL_SLUG } from "@/lib/seed-data";
import { visitedCount, isTrailComplete } from "@/lib/trail";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { MyTrailEntry } from "@/components/my-trail/MyTrailEntry";
import { CompletionBanner } from "@/components/completion/CompletionBanner";
import { WineTastingSection } from "@/components/tasting/WineTastingSection";
import { TrailPicker } from "@/components/trail/TrailPicker";
import { getWineryTastingProgress } from "@/lib/recommendations";
import { AuthModal } from "@/components/auth/AuthModal";

export default async function MyTrailPage({
  searchParams,
}: {
  searchParams: Promise<{ trail?: string }>;
}) {
  const { trail: trailParam } = await searchParams;
  const user = await getCurrentUser();
  const trails = await getAllTrails();
  const selectedTrail = trails.find((t) => t.slug === trailParam) ?? trails.find((t) => t.slug === DEFAULT_TRAIL_SLUG);
  const selectedSlug = selectedTrail?.slug ?? DEFAULT_TRAIL_SLUG;

  const [trailWineryLists, wineries, wines, customTastings] = await Promise.all([
    Promise.all(trails.map((t) => getTrailWineries(t.slug))),
    getWineriesWithStatus(user?.id ?? null, selectedSlug),
    getWinesWithTastings(user?.id ?? null, selectedSlug),
    user ? getCustomWineTastings(user.id) : Promise.resolve([]),
  ]);
  const stopCountBySlug = new Map(trails.map((t, i) => [t.slug, trailWineryLists[i].length]));
  const visited = visitedCount(wineries);
  const complete = isTrailComplete(wineries);
  const hasWineries = wineries.length > 0;

  return (
    <>
      <main className="mx-auto flex max-w-md flex-col gap-8 pb-10">
        <Header eyebrow="My Trails" title={selectedTrail?.name ?? "Your Trail"} />

        <div className="mx-auto w-full max-w-md px-6">
          <TrailPicker trails={trails} selectedSlug={selectedSlug} stopCountBySlug={stopCountBySlug} basePath="/my-trail" />
        </div>

        {hasWineries ? (
          <>
            <div className="mx-auto w-full max-w-md px-6">
              <div className="flex items-baseline justify-between">
                <p className="font-serif-display text-lg text-[var(--color-charcoal)]">
                  {visited} of {wineries.length} Stops Complete
                </p>
              </div>
              <ProgressBar value={visited} max={wineries.length} className="mt-3" />
            </div>

            {complete && (
              <div className="mx-auto w-full max-w-md px-6">
                <CompletionBanner />
              </div>
            )}

            <div className="mx-auto flex w-full max-w-md flex-col gap-3 px-6">
              {wineries.map((w) => (
                <MyTrailEntry key={w.id} winery={w} tastingProgress={getWineryTastingProgress(wines, w.id)} />
              ))}
            </div>

            <div className="mx-auto w-full max-w-md px-6">
              <div className="gold-divider mb-8" />
              <WineTastingSection wines={wines} wineries={wineries} customTastings={customTastings} />
            </div>
          </>
        ) : (
          <div className="mx-auto w-full max-w-md px-6">
            <Card className="px-4 py-6 text-center text-sm text-[var(--color-charcoal)]/55">
              {selectedTrail?.name ?? "This trail"} is coming soon — check back once it has wineries to visit.
            </Card>
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
