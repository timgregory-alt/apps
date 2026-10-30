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
export function computeTrend(
  point: { thisWeek: number | null; lastWeek: number | null } | undefined,
  options?: { decimals?: number; unit?: string }
): Trend | null {
  if (!point || point.thisWeek == null || point.lastWeek == null) return null;
  if (point.thisWeek === 0 && point.lastWeek === 0) return null;

  const decimals = options?.decimals ?? 0;
  const unit = options?.unit ?? "";
  const scale = 10 ** decimals;
  const delta = Math.round((point.thisWeek - point.lastWeek) * scale) / scale;
  const direction: TrendDirection = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  const magnitude = decimals > 0 ? Math.abs(delta).toFixed(decimals) : String(Math.abs(delta));
  const sign = delta > 0 ? "+" : delta < 0 ? "−" : "±";

  return { direction, label: `${sign}${magnitude}${unit} vs last week` };
}
