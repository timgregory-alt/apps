import type { WineryHours, WineryWeeklyHours } from "./types";

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

const WEEKDAY_ABBR = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** "14:30:00" (a Postgres `time`) -> "2:30pm"; "11:00:00" -> "11am" (no
 * ":00" clutter on the hour). */
function formatTimeOfDay(time: string): string {
  const [hoursStr, minutesStr] = time.split(":");
  const hours24 = Number(hoursStr);
  const minutes = Number(minutesStr);
  const period = hours24 >= 12 ? "pm" : "am";
  const hours12 = hours24 % 12 || 12;
  return minutes === 0 ? `${hours12}${period}` : `${hours12}:${String(minutes).padStart(2, "0")}${period}`;
}

/** Turns one row per day (day_of_week 0=Monday..6=Sunday) into grouped
 * { days, time } lines — consecutive days with the same open/close (or
 * both closed) collapse into one line ("Mon–Fri" instead of five rows),
 * same shape parseHoursLines produces so both render through HoursLines.
 * Expects at most one row per day; extra days are ignored, missing days
 * are just skipped rather than assumed closed. */
export function formatWeeklyHoursLines(rows: WineryWeeklyHours[]): HoursLine[] {
  const byDay = new Map(rows.map((r) => [r.day_of_week, r]));
  const sorted = [...byDay.keys()].sort((a, b) => a - b).map((d) => byDay.get(d)!);
  if (sorted.length === 0) return [];

  const lines: HoursLine[] = [];
  let i = 0;
  while (i < sorted.length) {
    const start = sorted[i];
    let j = i;
    while (
      j + 1 < sorted.length &&
      sorted[j + 1].day_of_week === sorted[j].day_of_week + 1 &&
      sorted[j + 1].is_closed === start.is_closed &&
      sorted[j + 1].open_time === start.open_time &&
      sorted[j + 1].close_time === start.close_time
    ) {
      j++;
    }

    const days =
      i === j ? WEEKDAY_ABBR[start.day_of_week] : `${WEEKDAY_ABBR[start.day_of_week]}–${WEEKDAY_ABBR[sorted[j].day_of_week]}`;
    const time = start.is_closed
      ? "Closed"
      : start.open_time && start.close_time
        ? `${formatTimeOfDay(start.open_time)}–${formatTimeOfDay(start.close_time)}`
        : "Hours vary";

    lines.push({ days, time });
    i = j + 1;
  }
  return lines;
}
