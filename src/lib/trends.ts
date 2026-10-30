export type TrendDirection = "up" | "down" | "flat";

export interface Trend {
  direction: TrendDirection;
  label: string;
}

/** Turns a { thisWeek, lastWeek } pair into a "+N vs last week" trend
 * badge. Returns null when there's nothing meaningful to show — either
 * side is unknown (e.g. no checked-in guest with a birth date on file
 * that week), or both weeks are zero. `decimals`/`unit` are for a
 * non-integer metric like average age ("+1.2 yrs"); counts default to
 * whole numbers. */
function trendFromPair(
  current: number | null,
  prior: number | null,
  periodLabel: string,
  options?: { decimals?: number; unit?: string }
): Trend | null {
  if (current == null || prior == null) return null;
  if (current === 0 && prior === 0) return null;

  const decimals = options?.decimals ?? 0;
  const unit = options?.unit ?? "";
  const scale = 10 ** decimals;
  const delta = Math.round((current - prior) * scale) / scale;
  const direction: TrendDirection = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  const magnitude = decimals > 0 ? Math.abs(delta).toFixed(decimals) : String(Math.abs(delta));
  const sign = delta > 0 ? "+" : delta < 0 ? "−" : "±";

  return { direction, label: `${sign}${magnitude}${unit} vs ${periodLabel}` };
}

export function computeTrend(
  point: { thisWeek: number | null; lastWeek: number | null } | undefined,
  options?: { decimals?: number; unit?: string }
): Trend | null {
  if (!point) return null;
  return trendFromPair(point.thisWeek, point.lastWeek, "last week", options);
}

/** Same comparison as computeTrend, but last-30-days vs the 30 days
 * before that — for the hover detail on a stat card. */
export function computeTrend30(
  point: { last30: number | null; prev30: number | null } | undefined,
  options?: { decimals?: number; unit?: string }
): Trend | null {
  if (!point) return null;
  return trendFromPair(point.last30, point.prev30, "previous 30 days", options);
}
