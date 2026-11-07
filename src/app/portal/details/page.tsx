import { getWineryStaffContext } from "@/lib/portal";
import { getWineryHours, getWineryWeeklyHours } from "@/lib/data";
import { PortalDetailsForm } from "@/components/portal/PortalDetailsForm";
import { SeasonalHoursEditor } from "@/components/admin/SeasonalHoursEditor";
import { WeeklyHoursEditor } from "@/components/portal/WeeklyHoursEditor";

export default async function PortalDetailsPage() {
  const ctx = await getWineryStaffContext();
  if (!ctx) return null;

  const [seasons, weeklyHours] = await Promise.all([
    getWineryHours(ctx.winery.id),
    getWineryWeeklyHours(ctx.winery.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif-display text-2xl text-[var(--color-charcoal)]">Winery Details</h1>
        <p className="mt-1 text-sm text-[var(--color-charcoal)]/55">
          Keep your hours and links current — guests see these on your winery page. Your name, address, and
          trail settings are managed by the trail admin.
        </p>
      </div>

      <PortalDetailsForm winery={ctx.winery} />
      <WeeklyHoursEditor wineryId={ctx.winery.id} initialDays={weeklyHours} />
      <SeasonalHoursEditor wineryId={ctx.winery.id} initialSeasons={seasons} />
    </div>
  );
}
