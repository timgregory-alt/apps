import { getCurrentUser, getWineriesWithStatus } from "@/lib/data";
import { Header } from "@/components/layout/Header";
import { TrailPlanner } from "@/components/map/TrailPlanner";

export default async function TrailPlanPage() {
  const user = await getCurrentUser();
  const wineries = await getWineriesWithStatus(user?.id ?? null);

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 pb-10">
      <Header back="/map" eyebrow="Wine Trails" title="Plan My Wine Trail" />
      <p className="px-6 -mt-3 text-sm text-[var(--color-charcoal)]/60">
        Select a stop to see driving directions, or follow the suggested order below.
      </p>
      <div className="px-6">
        <TrailPlanner wineries={wineries} />
      </div>
    </main>
  );
}
