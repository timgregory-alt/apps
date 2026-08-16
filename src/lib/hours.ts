import type { WineryHours } from "./types";

/** True if `month` (1–12) falls within [start, end], wrapping across year-end if start > end. */
function monthInRange(month: number, start: number, end: number): boolean {
  if (start <= end) return month >= start && month <= end;
  return month >= start || month <= end;
}

/** The seasonal hours block that applies right now, if the winery has any configured. */
export function getCurrentSeasonHours(
  rows: WineryHours[],
  now: Date = new Date()
): WineryHours | null {
  if (rows.length === 0) return null;
  const month = now.getMonth() + 1;
  return rows.find((r) => monthInRange(month, r.start_month, r.end_month)) ?? rows[0];
}

const MONTH_ABBR = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function formatMonthRange(startMonth: number, endMonth: number): string {
  const start = MONTH_ABBR[startMonth - 1];
  const end = MONTH_ABBR[endMonth - 1];
  return start === end ? start : `${start}–${end}`;
}
