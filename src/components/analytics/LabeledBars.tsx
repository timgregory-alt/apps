/** A simple horizontal bar per labeled bucket, scaled to whichever bucket
 * has the highest count — shared across the admin dashboard and each
 * winery's portal dashboard for age groups, peak visit day/time, and
 * anything else shaped as a list of (label, count). */
export function LabeledBars({ bars }: { bars: { label: string; count: number }[] }) {
  const max = Math.max(1, ...bars.map((b) => b.count));
  const total = bars.reduce((sum, b) => sum + b.count, 0);

  if (total === 0) {
    return <p className="text-sm text-[var(--color-charcoal)]/45">No data yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {bars.map((b) => (
        <div key={b.label} className="flex items-center gap-3 text-sm">
          <span className="w-32 shrink-0 truncate text-[var(--color-charcoal)]/60">{b.label}</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-black/5">
            <div
              className="h-full rounded-full bg-[var(--color-burgundy)]"
              style={{ width: `${(b.count / max) * 100}%` }}
            />
          </div>
          <span className="w-8 shrink-0 text-right text-[var(--color-charcoal)]/70">{b.count}</span>
        </div>
      ))}
    </div>
  );
}
