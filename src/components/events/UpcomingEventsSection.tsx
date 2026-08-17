import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { WineryEventWithWinery } from "@/lib/types";

const MONTH_ABBR = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

/** Parsed from string parts, not `new Date(...)`, so a plain YYYY-MM-DD date
 * never shifts a day backward in negative-UTC timezones. */
function formatEventDateParts(isoDate: string): { month: string; day: number } {
  const [, month, day] = isoDate.split("-").map(Number);
  return { month: MONTH_ABBR[month - 1], day };
}

export function UpcomingEventsSection({ events }: { events: WineryEventWithWinery[] }) {
  if (events.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 px-6">
      <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-charcoal)]/45">
        <CalendarDays size={14} className="text-[var(--color-gold)]" />
        Upcoming Events
      </p>
      {events.map((event) => {
        const { month, day } = formatEventDateParts(event.event_date);
        return (
          <Link key={event.id} href={`/winery/${event.winery_slug}`}>
            <Card className="flex items-center gap-4 p-3">
              <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-[var(--color-gold-pale)]/40 text-[var(--color-burgundy)]">
                <span className="text-[0.65rem] font-semibold tracking-wide">{month}</span>
                <span className="font-serif-display text-xl leading-none">{day}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--color-charcoal)]">
                  {event.title}
                </p>
                <p className="truncate text-xs text-[var(--color-charcoal)]/55">
                  {event.winery_name}
                  {event.event_time ? ` · ${event.event_time}` : ""}
                </p>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
