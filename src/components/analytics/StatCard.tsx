import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Trend } from "@/lib/trends";

const TREND_ICONS = { up: ArrowUp, down: ArrowDown, flat: Minus } as const;
const TREND_COLORS = {
  up: "text-[var(--color-gold)]",
  down: "text-[var(--color-charcoal)]/45",
  flat: "text-[var(--color-charcoal)]/45",
} as const;

function TrendLine({ trend, className }: { trend: Trend; className?: string }) {
  const Icon = TREND_ICONS[trend.direction];
  return (
    <p className={cn("flex items-center gap-1 text-[0.7rem] font-medium", TREND_COLORS[trend.direction], className)}>
      <Icon size={11} strokeWidth={2.5} />
      {trend.label}
    </p>
  );
}

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
 * forward-looking counts like upcoming events. `trend30` adds the same
 * comparison over 30 days, revealed in a hover tooltip instead of taking
 * up permanent space on the card. */
export function StatCard({
  label,
  value,
  caption,
  trend,
  trend30,
}: {
  label: string;
  value: string | number;
  caption?: string;
  trend?: Trend | null;
  trend30?: Trend | null;
}) {
  const isLong = String(value).length > 14;

  return (
    <div
      className={cn(
        "group relative min-w-0 overflow-visible rounded-2xl border border-[var(--color-line)] bg-white px-5 py-4 transition-colors",
        trend30 && "hover:border-[var(--color-gold)]/50"
      )}
    >
      <p
        className={cn(
          "break-words font-serif-display text-[var(--color-burgundy)]",
          isLong ? "text-lg leading-snug" : "text-3xl"
        )}
      >
        {value}
      </p>
      {trend && <TrendLine trend={trend} className="mt-0.5" />}
      {caption && <p className="mt-0.5 text-xs text-[var(--color-charcoal)]/55">{caption}</p>}
      <p className="mt-1 text-xs uppercase tracking-wide text-[var(--color-charcoal)]/50">{label}</p>

      {trend30 && (
        <div
          role="tooltip"
          className="pointer-events-none absolute bottom-[calc(100%+0.5rem)] left-1/2 z-20 w-max max-w-[14rem] -translate-x-1/2 rounded-xl bg-[var(--color-charcoal)] px-3 py-2 text-center opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100"
        >
          <p className="text-[0.65rem] font-medium uppercase tracking-wide text-[var(--color-ivory)]/50">
            Last 30 Days
          </p>
          <TrendLine trend={trend30} className="mt-0.5 justify-center !text-[var(--color-gold-pale)]" />
          <div className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-[var(--color-charcoal)]" />
        </div>
      )}
    </div>
  );
}
