import { getAllTrailsAdmin, getAllTrailAssignmentsAdmin, getAllWineriesAdmin } from "@/lib/admin";
import { TrailBoard } from "@/components/admin/TrailBoard";
import { AddTrailForm } from "@/components/admin/AddTrailForm";

export default async function AdminTrailsPage() {
  const [trails, assignments, wineries] = await Promise.all([
    getAllTrailsAdmin(),
    getAllTrailAssignmentsAdmin(),
    getAllWineriesAdmin(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif-display text-2xl text-[var(--color-charcoal)]">Trails</h1>
        <p className="mt-1 text-sm text-[var(--color-charcoal)]/55">
          Drag a winery into the trail it belongs on, or into Unassigned to take it off every trail.
          Reorder within a trail by dragging up or down. Click a trail&rsquo;s name to rename it. New
          wineries show up under Unassigned automatically — nothing here needs a code change.
        </p>
      </div>

      <AddTrailForm />

      <TrailBoard trails={trails} wineries={wineries} assignments={assignments} />
    </div>
  );
}
