"use client";

import { useState, useTransition } from "react";
import { saveWineryWeeklyHoursAction, type WeeklyHoursInput } from "@/app/admin/wineries/actions";
import type { WineryWeeklyHours } from "@/lib/types";

const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const inputClass =
  "h-10 w-full rounded-lg border border-[var(--color-line)] bg-white px-2.5 text-sm outline-none focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold)]/25 disabled:bg-black/5 disabled:text-[var(--color-charcoal)]/35";

function emptyDays(): WeeklyHoursInput[] {
  return DAY_LABELS.map((_, day_of_week) => ({
    day_of_week,
    is_closed: false,
    open_time: "11:00",
    close_time: "18:00",
  }));
}

export function WeeklyHoursEditor({
  wineryId,
  initialDays,
}: {
  wineryId: string;
  initialDays: WineryWeeklyHours[];
}) {
  const [days, setDays] = useState<WeeklyHoursInput[]>(() => {
    if (initialDays.length === 0) return emptyDays();
    const byDay = new Map(initialDays.map((d) => [d.day_of_week, d]));
    return DAY_LABELS.map((_, day_of_week) => {
      const existing = byDay.get(day_of_week);
      return {
        day_of_week,
        is_closed: existing?.is_closed ?? false,
        open_time: existing?.open_time?.slice(0, 5) ?? "11:00",
        close_time: existing?.close_time?.slice(0, 5) ?? "18:00",
      };
    });
  });
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateDay(index: number, patch: Partial<WeeklyHoursInput>) {
    setSaved(false);
    setDays((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await saveWineryWeeklyHoursAction(wineryId, days);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setSaved(true);
    });
  }

  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
      <p className="text-sm font-medium text-[var(--color-charcoal)]">Weekly Hours</p>
      <p className="mt-1 text-xs text-[var(--color-charcoal)]/55">
        Set your regular hours for each day of the week. These take priority over the plain Hours field
        and Seasonal Hours below once saved.
      </p>

      <div className="mt-4 flex flex-col divide-y divide-[var(--color-line)]">
        {days.map((day, i) => (
          <div key={day.day_of_week} className="flex flex-wrap items-center gap-3 py-3">
            <span className="w-20 shrink-0 text-sm font-medium text-[var(--color-charcoal)]">
              {DAY_LABELS[day.day_of_week]}
            </span>

            <label className="flex shrink-0 items-center gap-1.5 text-xs text-[var(--color-charcoal)]/60">
              <input
                type="checkbox"
                checked={day.is_closed}
                onChange={(e) => updateDay(i, { is_closed: e.target.checked })}
                className="h-4 w-4 rounded border-[var(--color-line)] accent-[var(--color-burgundy)]"
              />
              Closed
            </label>

            <div className="flex min-w-0 flex-1 items-center gap-2">
              <input
                type="time"
                value={day.open_time ?? ""}
                disabled={day.is_closed}
                onChange={(e) => updateDay(i, { open_time: e.target.value })}
                className={inputClass}
              />
              <span className="text-xs text-[var(--color-charcoal)]/40">to</span>
              <input
                type="time"
                value={day.close_time ?? ""}
                disabled={day.is_closed}
                onChange={(e) => updateDay(i, { close_time: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
        ))}
      </div>

      {error && <p className="mt-3 text-sm text-[var(--color-burgundy)]">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={pending}
        className="mt-4 h-10 w-full rounded-full bg-[var(--color-charcoal)] text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : saved ? "Saved" : "Save Weekly Hours"}
      </button>
    </div>
  );
}
