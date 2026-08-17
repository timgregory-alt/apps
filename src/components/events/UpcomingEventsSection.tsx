"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { WineryEventGroup } from "@/lib/types";

const MONTH_ABBR = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

/** Parsed from string parts, not `new Date(...)`, so a plain YYYY-MM-DD date
 * never shifts a day backward in negative-UTC timezones. */
function formatEventDateParts(isoDate: string): { month: string; day: number } {
  const [, month, day] = isoDate.split("-").map(Number);
  return { month: MONTH_ABBR[month - 1], day };
}

/** One slide per winery — so a winery with lots of upcoming events can't
 * crowd the others out of a shared, soonest-first list. Same swipeable
 * scroll-snap carousel mechanic as the reward tier carousel. */
export function UpcomingEventsSection({ groups }: { groups: WineryEventGroup[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    function onScroll() {
      const { scrollLeft, clientWidth } = track!;
      setActiveIndex(Math.round(scrollLeft / clientWidth));
    }
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, []);

  function scrollToIndex(index: number) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
  }

  if (groups.every((g) => g.events.length === 0)) return null;

  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-center gap-2 px-6 text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-charcoal)]/45">
        <CalendarDays size={14} className="text-[var(--color-gold)]" />
        Upcoming Events
      </p>

      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth px-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {groups.map((group) => (
          <div key={group.winery_id} className="w-full shrink-0 snap-center">
            <Card className="flex h-72 flex-col p-5">
              <p className="shrink-0 font-serif-display text-lg text-[var(--color-charcoal)]">
                {group.winery_name}
              </p>

              {group.events.length === 0 ? (
                <p className="mt-3 text-sm text-[var(--color-charcoal)]/50">
                  Nothing scheduled yet — check back soon.
                </p>
              ) : (
                <ul className="mt-2 flex min-h-0 flex-1 flex-col divide-y divide-[var(--color-line)] overflow-y-auto">
                  {group.events.map((event) => {
                    const { month, day } = formatEventDateParts(event.event_date);
                    return (
                      <li key={event.id} className="flex items-center gap-3 py-2.5">
                        <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-[var(--color-gold-pale)]/40 text-[var(--color-burgundy)]">
                          <span className="text-[0.6rem] font-semibold tracking-wide">{month}</span>
                          <span className="font-serif-display text-lg leading-none">{day}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[var(--color-charcoal)]">
                            {event.title}
                          </p>
                          {event.event_time && (
                            <p className="truncate text-xs text-[var(--color-charcoal)]/55">
                              {event.event_time}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              <Link
                href={`/winery/${group.winery_slug}`}
                className="mt-3 flex shrink-0 items-center gap-1 text-xs font-medium text-[var(--color-burgundy)]"
              >
                View {group.winery_name}
                <ArrowRight size={13} strokeWidth={2.25} />
              </Link>
            </Card>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          aria-label="Previous winery"
          onClick={() => scrollToIndex(Math.max(0, activeIndex - 1))}
          disabled={activeIndex === 0}
          className="text-[var(--color-charcoal)]/50 disabled:opacity-25"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex items-center gap-1.5">
          {groups.map((group, i) => (
            <button
              key={group.winery_id}
              type="button"
              aria-label={`Show ${group.winery_name}`}
              onClick={() => scrollToIndex(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === activeIndex ? "w-5 bg-[var(--color-burgundy)]" : "w-1.5 bg-[var(--color-charcoal)]/20"
              )}
            />
          ))}
        </div>

        <button
          type="button"
          aria-label="Next winery"
          onClick={() => scrollToIndex(Math.min(groups.length - 1, activeIndex + 1))}
          disabled={activeIndex === groups.length - 1}
          className="text-[var(--color-charcoal)]/50 disabled:opacity-25"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <p className="text-center text-xs text-[var(--color-charcoal)]/45">
        {activeIndex + 1} of {groups.length} wineries
      </p>
    </div>
  );
}
