import { Suspense } from "react";
import { getCurrentUser, getWineriesWithStatus, getTrailBySlug } from "@/lib/data";
import { DEFAULT_TRAIL_SLUG } from "@/lib/seed-data";
import { Header } from "@/components/layout/Header";
import { TrailPlanner } from "@/components/map/TrailPlanner";
import { AuthModal } from "@/components/auth/AuthModal";

export default async function TrailPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ trail?: string }>;
}) {
  const { trail: trailParam } = await searchParams;
  const trailSlug = trailParam ?? DEFAULT_TRAIL_SLUG;
  const user = await getCurrentUser();
  const [wineries, trail] = await Promise.all([
    getWineriesWithStatus(user?.id ?? null, trailSlug),
    getTrailBySlug(trailSlug),
  ]);

  return (
    <>
      <main className="mx-auto flex max-w-md flex-col gap-6 pb-10">
        <Header
          back={`/?trail=${encodeURIComponent(trailSlug)}`}
          eyebrow="Wine Trails"
          title={`Plan My ${trail?.name ?? "Wine Trail"}`}
        />
        <p className="px-6 -mt-3 text-sm text-[var(--color-charcoal)]/60">
          Select a stop to see driving directions, or follow the suggested order below.
        </p>
        <div className="px-6">
          <TrailPlanner wineries={wineries} />
        </div>
      </main>
      {!user && (
        <Suspense>
          <AuthModal />
        </Suspense>
      )}
    </>
  );
}
