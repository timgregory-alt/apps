import { cn } from "@/lib/utils";

/** A labeled stat tile, shared across the admin dashboard and every portal
 * dashboard. Most values are short (a count, a percentage) and read well at
 * the large display size, but a handful (like a winery name) can run long —
 * those drop to a smaller size instead of overflowing into several lines of
 * oversized display type. */
export function StatCard({ label, value }: { label: string; value: string | number }) {
  const isLong = String(value).length > 14;

  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-white px-5 py-4">
      <p
        className={cn(
          "font-serif-display text-[var(--color-burgundy)]",
          isLong ? "text-lg leading-snug" : "text-3xl"
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-xs uppercase tracking-wide text-[var(--color-charcoal)]/50">{label}</p>
    </div>
  );
}
