/** A simple horizontal bar per age bracket, scaled to whichever bracket has
 * the most guests — shared by the admin dashboard (site-wide) and each
 * winery's portal dashboard (scoped to their own guests). */
export function AgeGroupBars({ groups }: { groups: { ageGroup: string; count: number }[] }) {
  const max = Math.max(1, ...groups.map((g) => g.count));
  const total = groups.reduce((sum, g) => sum + g.count, 0);

  if (total === 0) {
    return <p className="text-sm text-[var(--color-charcoal)]/45">No guest ages on file yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {groups.map((g) => (
        <div key={g.ageGroup} className="flex items-center gap-3 text-sm">
          <span className="w-12 shrink-0 text-[var(--color-charcoal)]/60">{g.ageGroup}</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-black/5">
            <div
              className="h-full rounded-full bg-[var(--color-burgundy)]"
              style={{ width: `${(g.count / max) * 100}%` }}
            />
          </div>
          <span className="w-8 shrink-0 text-right text-[var(--color-charcoal)]/70">{g.count}</span>
        </div>
      ))}
    </div>
  );
}
