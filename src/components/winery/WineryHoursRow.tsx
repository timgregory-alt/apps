"use client";

import { useState } from "react";
import { Clock, ChevronDown } from "lucide-react";
import { getCurrentSeasonHours, formatMonthRange, parseHoursLines } from "@/lib/hours";
import type { WineryHours } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Renders a free-text hours string as one line per day range instead of a
 * single run-on string, falling back to "Hours coming soon" when unset. */
function HoursLines({ text }: { text: string | null }) {
  const lines = parseHoursLines(text);
  if (lines.length === 0) {
    return <dd className="mt-0.5 text-sm text-[var(--color-charcoal)]/85">Hours coming soon</dd>;
  }
  return (
    <dd className="mt-1 flex flex-col gap-1 text-sm text-[var(--color-charcoal)]/85">
      {lines.map((line, i) => (
        <div key={i} className="flex items-baseline justify-between gap-3">
          <span>{line.days}</span>
          {line.time && <span className="text-[var(--color-charcoal)]/60">{line.time}</span>}
        </div>
      ))}
    </dd>
  );
}

export function WineryHoursRow({
  fallbackHours,
  seasons,
}: {
  fallbackHours: string | null;
  seasons: WineryHours[];
}) {
  const [expanded, setExpanded] = useState(false);

  if (seasons.length === 0) {
    return (
      <div className="flex items-start gap-3 px-4 py-3.5">
        <Clock size={17} strokeWidth={1.75} className="mt-0.5 shrink-0 text-[var(--color-gold)]" />
        <div className="min-w-0">
          <dt className="text-[0.68rem] font-medium uppercase tracking-[0.14em] text-[var(--color-charcoal)]/45">
            Hours
          </dt>
          <HoursLines text={fallbackHours} />
        </div>
      </div>
    );
  }

  const current = getCurrentSeasonHours(seasons);

  return (
    <div className="px-4 py-3.5">
      <div className="flex items-start gap-3">
        <Clock size={17} strokeWidth={1.75} className="mt-0.5 shrink-0 text-[var(--color-gold)]" />
        <div className="min-w-0 flex-1">
          <dt className="flex items-center gap-2 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-[var(--color-charcoal)]/45">
            Hours Now
            {current && (
              <span className="rounded-full bg-[var(--color-gold-pale)]/60 px-2 py-0.5 text-[0.6rem] font-semibold normal-case tracking-normal text-[var(--color-burgundy-deep)]">
                {formatMonthRange(current.start_month, current.end_month)}
              </span>
            )}
          </dt>
          <HoursLines text={current?.hours_text ?? fallbackHours ?? null} />

          {seasons.length > 1 && (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="mt-2 flex items-center gap-1 text-xs font-medium text-[var(--color-burgundy)]"
              aria-expanded={expanded}
            >
              {expanded ? "Hide" : "See"} full seasonal schedule
              <ChevronDown
                size={13}
                strokeWidth={2.5}
                className={cn("transition-transform", expanded && "rotate-180")}
              />
            </button>
          )}

          {expanded && (
            <ul className="mt-3 flex flex-col divide-y divide-[var(--color-line)] border-t border-[var(--color-line)]">
              {seasons.map((s) => {
                const isCurrent = s.id === current?.id;
                return (
                  <li
                    key={s.id}
                    className={cn(
                      "py-2 pl-2.5",
                      isCurrent && "border-l-2 border-[var(--color-gold)] bg-[var(--color-gold-pale)]/15"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <p
                        className={cn(
                          "text-xs font-semibold",
                          isCurrent ? "text-[var(--color-burgundy-deep)]" : "text-[var(--color-charcoal)]/70"
                        )}
                      >
                        {s.label}
                      </p>
                      {isCurrent && (
                        <span className="shrink-0 text-[0.6rem] font-semibold uppercase tracking-wide text-[var(--color-gold)]">
                          Now
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-charcoal)]/55">
                      {s.hours_text}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
