"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { saveWineryHoursAction, type SeasonalHoursInput } from "@/app/admin/wineries/actions";
import type { WineryHours } from "@/lib/types";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const inputClass =
  "h-10 w-full rounded-lg border border-[var(--color-line)] bg-white px-2.5 text-sm outline-none focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold)]/25";

function emptyRow(): SeasonalHoursInput {
  return { label: "", start_month: 1, end_month: 12, hours_text: "" };
}

export function SeasonalHoursEditor({
  wineryId,
  initialSeasons,
}: {
  wineryId: string;
  initialSeasons: WineryHours[];
}) {
  const [rows, setRows] = useState<SeasonalHoursInput[]>(
    initialSeasons.length > 0
      ? initialSeasons.map((s) => ({
          label: s.label,
          start_month: s.start_month,
          end_month: s.end_month,
          hours_text: s.hours_text,
        }))
      : []
  );
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateRow(index: number, patch: Partial<SeasonalHoursInput>) {
    setSaved(false);
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function removeRow(index: number) {
    setSaved(false);
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  function addRow() {
    setSaved(false);
    setRows((prev) => [...prev, emptyRow()]);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      try {
        await saveWineryHoursAction(wineryId, rows);
        setSaved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save seasonal hours.");
      }
    });
  }

  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
      <p className="text-sm font-medium text-[var(--color-charcoal)]">Seasonal Hours</p>
      <p className="mt-1 text-xs text-[var(--color-charcoal)]/55">
        Optional. Add one row per season (e.g. &ldquo;Apr–Oct&rdquo;). If empty, the plain Hours
        field above is shown as-is. The season covering today&rsquo;s month is shown as &ldquo;Hours
        Now&rdquo; on the winery page.
      </p>

      <div className="mt-4 flex flex-col gap-3">
        {rows.map((row, i) => (
          <div key={i} className="rounded-xl border border-[var(--color-line)] p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-charcoal)]/45">
                Season {i + 1}
              </span>
              <button
                type="button"
                onClick={() => removeRow(i)}
                aria-label={`Remove season ${i + 1}`}
                className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--color-charcoal)]/40 hover:bg-black/5 hover:text-[var(--color-burgundy)]"
              >
                <Trash2 size={14} strokeWidth={2} />
              </button>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="col-span-2 flex flex-col gap-1 text-xs">
                <span className="text-[var(--color-charcoal)]/50">Label</span>
                <input
                  type="text"
                  value={row.label}
                  onChange={(e) => updateRow(i, { label: e.target.value })}
                  placeholder="e.g. Apr – Oct"
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-[var(--color-charcoal)]/50">Start month</span>
                <select
                  value={row.start_month}
                  onChange={(e) => updateRow(i, { start_month: Number(e.target.value) })}
                  className={inputClass}
                >
                  {MONTHS.map((m, idx) => (
                    <option key={m} value={idx + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-[var(--color-charcoal)]/50">End month</span>
                <select
                  value={row.end_month}
                  onChange={(e) => updateRow(i, { end_month: Number(e.target.value) })}
                  className={inputClass}
                >
                  {MONTHS.map((m, idx) => (
                    <option key={m} value={idx + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
              <label className="col-span-2 flex flex-col gap-1 text-xs">
                <span className="text-[var(--color-charcoal)]/50">Hours</span>
                <input
                  type="text"
                  value={row.hours_text}
                  onChange={(e) => updateRow(i, { hours_text: e.target.value })}
                  placeholder="e.g. Mon–Sat 11am–8pm · Sun 12pm–6pm"
                  className={inputClass}
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRow}
        className="mt-3 flex items-center gap-1.5 text-sm font-medium text-[var(--color-burgundy)]"
      >
        <Plus size={15} strokeWidth={2} />
        Add Season
      </button>

      {error && <p className="mt-3 text-sm text-[var(--color-burgundy)]">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={pending}
        className="mt-4 h-10 w-full rounded-full bg-[var(--color-charcoal)] text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : saved ? "Saved" : "Save Seasonal Hours"}
      </button>
    </div>
  );
}
