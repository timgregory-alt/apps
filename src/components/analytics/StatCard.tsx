import { cn } from "@/lib/utils";

/** A labeled stat tile, shared across the admin dashboard and every portal
 * dashboard. Most values are short (a count, a percentage) and read well at
 * the large display size, but a handful (like a winery name) can run long —
 * those drop to a smaller size instead of overflowing into several lines of
 * oversized display type. An optional `caption` holds a short secondary
 * detail (e.g. a guest count next to a top-city value) — keep it out of
 * `label` itself, which should stay a short, static category name so it
 * never wraps across several lines of small caps. */
export function StatCard({
  label,
  value,
  caption,
}: {
  label: string;
  value: string | number;
  caption?: string;
}) {
  const isLong = String(value).length > 14;

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white px-5 py-4">
      <p
        className={cn(
          "break-words font-serif-display text-[var(--color-burgundy)]",
          isLong ? "text-lg leading-snug" : "text-3xl"
        )}
      >
        {value}
      </p>
      {caption && <p className="mt-0.5 text-xs text-[var(--color-charcoal)]/55">{caption}</p>}
      <p className="mt-1 text-xs uppercase tracking-wide text-[var(--color-charcoal)]/50">{label}</p>
    </div>
  );
}
