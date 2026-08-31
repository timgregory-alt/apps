import { getWineryStaffContext, getWineryGuestList } from "@/lib/portal";
import { formatCheckinDate } from "@/lib/utils";

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

  const guests = await getWineryGuestList(ctx.winery.id);
  const repeatGuests = guests.filter((g) => g.visitCount > 1).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif-display text-2xl text-[var(--color-charcoal)]">Guests</h1>
        <p className="mt-1 text-sm text-[var(--color-charcoal)]/55">
          Guests who&rsquo;ve checked in at {ctx.winery.name} — disclosed in the Terms of Service. This
          list is scoped to your winery only; you can&rsquo;t see visits to any other winery on the
          trail.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Guests" value={guests.length} />
        <StatCard label="Repeat Guests" value={repeatGuests} />
      </div>

      {guests.length === 0 ? (
        <p className="text-sm text-[var(--color-charcoal)]/50">No check-ins yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--color-line)] bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-line)] text-xs uppercase tracking-wide text-[var(--color-charcoal)]/50">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Visits</th>
                <th className="px-4 py-3 font-medium">First Visit</th>
                <th className="px-4 py-3 font-medium">Last Visit</th>
              </tr>
            </thead>
            <tbody>
              {guests.map((g) => (
                <tr key={g.userId} className="border-b border-[var(--color-line)] last:border-0">
                  <td className="px-4 py-3 text-[var(--color-charcoal)]">{g.name || "(no name)"}</td>
                  <td className="px-4 py-3 text-[var(--color-charcoal)]/70">{g.email}</td>
                  <td className="px-4 py-3 text-[var(--color-charcoal)]/70">{g.visitCount}</td>
                  <td className="px-4 py-3 text-[var(--color-charcoal)]/70">{formatCheckinDate(g.firstVisit)}</td>
                  <td className="px-4 py-3 text-[var(--color-charcoal)]/70">{formatCheckinDate(g.lastVisit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
