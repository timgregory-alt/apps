import { getWineryStaffContext, getRepeatGuestStats } from "@/lib/portal";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-white px-5 py-4">
      <p className="font-serif-display text-3xl text-[var(--color-burgundy)]">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-[var(--color-charcoal)]/50">{label}</p>
    </div>
  );
}

export default async function PortalGuestsPage() {
  const ctx = await getWineryStaffContext();
  if (!ctx) return null;

  const stats = await getRepeatGuestStats(ctx.winery.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif-display text-2xl text-[var(--color-charcoal)]">Guests</h1>
        <p className="mt-1 text-sm text-[var(--color-charcoal)]/55">
          How guests are returning to {ctx.winery.name} — aggregate visit counts only, never individual
          guest names or contact details.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Guests" value={stats.totalGuests} />
        <StatCard label="Visited Once" value={stats.oneVisit} />
        <StatCard label="Visited Twice" value={stats.twoVisits} />
        <StatCard label="Visited 3+ Times" value={stats.threeOrMoreVisits} />
      </div>
    </div>
  );
}
