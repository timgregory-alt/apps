import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Trend } from "@/lib/trends";

const TREND_ICONS = { up: ArrowUp, down: ArrowDown, flat: Minus } as const;
const TREND_COLORS = {
  up: "text-[var(--color-gold)]",
  down: "text-[var(--color-charcoal)]/45",
  flat: "text-[var(--color-charcoal)]/45",
} as const;

/** A labeled stat tile, shared across the admin dashboard and every portal
 * dashboard. Most values are short (a count, a percentage) and read well at
 * the large display size, but a handful (like a winery name) can run long —
 * those drop to a smaller size instead of overflowing into several lines of
 * oversized display type. An optional `caption` holds a short secondary
 * detail (e.g. a guest count next to a top-city value) — keep it out of
 * `label` itself, which should stay a short, static category name so it
 * never wraps across several lines of small caps. An optional `trend`
 * shows a small "+N vs last week" badge (see src/lib/trends.ts) — only
 * pass this for metrics a 7-day comparison actually makes sense for, not
 * forward-looking counts like upcoming events. */
export function StatCard({
  label,
  value,
  caption,
  trend,
}: {
  label: string;
  value: string | number;
  caption?: string;
  trend?: Trend | null;
}) {
  const isLong = String(value).length > 14;
  const TrendIcon = trend ? TREND_ICONS[trend.direction] : null;

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
      {trend && TrendIcon && (
        <p className={cn("mt-0.5 flex items-center gap-1 text-[0.7rem] font-medium", TREND_COLORS[trend.direction])}>
          <TrendIcon size={11} strokeWidth={2.5} />
          {trend.label}
        </p>
      )}
      {caption && <p className="mt-0.5 text-xs text-[var(--color-charcoal)]/55">{caption}</p>}
      <p className="mt-1 text-xs uppercase tracking-wide text-[var(--color-charcoal)]/50">{label}</p>
    </div>
  );
}
