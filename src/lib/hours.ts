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

export interface HoursLine {
  days: string;
  time: string;
}

/** Splits a free-text hours string like "Closed Mon–Wed · Thu 2pm–8pm ·
 * Fri–Sat 1pm–9pm · Sun 1pm–6pm" (the convention every winery's `hours`
 * field follows) into one { days, time } pair per `·`-separated segment, so
 * each day range can render on its own line instead of one run-on string. */
export function parseHoursLines(hours: string | null): HoursLine[] {
  if (!hours) return [];
  return hours
    .split("·")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => {
      const match = segment.match(/^([^\d]*)(.*)$/);
      const days = (match?.[1] ?? segment).trim();
      const time = (match?.[2] ?? "").trim();
      return { days: days || segment, time };
    });
}
