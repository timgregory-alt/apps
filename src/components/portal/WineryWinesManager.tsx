"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { createWineAction, updateWineAction, deleteWineAction, type WineInput } from "@/app/portal/wines/actions";
import { STYLE_LABELS, STYLE_BADGE } from "@/lib/recommendations";
import type { Wine, WineStyle } from "@/lib/types";

const inputClass =
  "h-10 w-full rounded-lg border border-[var(--color-line)] bg-white px-2.5 text-sm outline-none focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold)]/25";
const labelTextClass = "text-xs font-medium uppercase tracking-wide text-[var(--color-charcoal)]/50";
const STYLES = Object.keys(STYLE_LABELS) as WineStyle[];

function toInput(w?: Wine): WineInput {
  return {
    name: w?.name ?? "",
    varietal: w?.varietal ?? "",
    style: w?.style ?? "red",
    tasting_notes: w?.tasting_notes ?? "",
    food_pairing: w?.food_pairing ?? "",
    sold_out: w?.sold_out ?? false,
  };
}

function WineFields({ value, onChange }: { value: WineInput; onChange: (patch: Partial<WineInput>) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <label className="col-span-2 flex flex-col gap-1">
        <span className={labelTextClass}>Name</span>
        <input value={value.name} onChange={(e) => onChange({ name: e.target.value })} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1">
        <span className={labelTextClass}>Varietal</span>
        <input
          value={value.varietal}
          onChange={(e) => onChange({ varietal: e.target.value })}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className={labelTextClass}>Style</span>
        <select
          value={value.style}
          onChange={(e) => onChange({ style: e.target.value as WineStyle })}
          className={inputClass}
        >
          {STYLES.map((s) => (
            <option key={s} value={s}>
              {STYLE_LABELS[s]}
            </option>
          ))}
        </select>
      </label>
      <label className="col-span-2 flex flex-col gap-1">
        <span className={labelTextClass}>Tasting Notes</span>
        <textarea
          value={value.tasting_notes}
          onChange={(e) => onChange({ tasting_notes: e.target.value })}
          rows={2}
          className="w-full rounded-lg border border-[var(--color-line)] bg-white px-2.5 py-2 text-sm outline-none focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold)]/25"
        />
      </label>
      <label className="col-span-2 flex flex-col gap-1">
        <span className={labelTextClass}>Food Pairing</span>
        <input
          value={value.food_pairing}
          onChange={(e) => onChange({ food_pairing: e.target.value })}
          className={inputClass}
        />
      </label>
      <label className="col-span-2 flex items-center gap-2 text-sm text-[var(--color-charcoal)]">
        <input
          type="checkbox"
          checked={value.sold_out}
          onChange={(e) => onChange({ sold_out: e.target.checked })}
          className="h-4 w-4"
        />
        Sold out
      </label>
    </div>
  );
}

function WineRow({ wineryId, wine }: { wineryId: string; wine: Wine }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<WineInput>(toInput(wine));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await updateWineAction(wineryId, wine.id, draft);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setEditing(false);
    });
  }

  function remove() {
    if (!confirm(`Delete "${wine.name}"?`)) return;
    startTransition(async () => {
      await deleteWineAction(wineryId, wine.id);
    });
  }

  if (editing) {
    return (
      <div className="rounded-2xl border border-[var(--color-gold)]/40 bg-white p-4">
        <WineFields value={draft} onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))} />
        {error && <p className="mt-2 text-xs text-[var(--color-burgundy)]">{error}</p>}
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="h-9 rounded-full bg-[var(--color-charcoal)] px-4 text-xs font-medium text-white disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(toInput(wine));
              setEditing(false);
            }}
            className="h-9 rounded-full border border-[var(--color-line)] px-4 text-xs font-medium text-[var(--color-charcoal)]/70"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-line)] bg-white p-4">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-medium text-[var(--color-charcoal)]">{wine.name}</p>
          <span className="shrink-0 rounded-full bg-black/5 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-[var(--color-charcoal)]/55">
            {STYLE_BADGE[wine.style]}
          </span>
          {wine.sold_out && (
            <span className="shrink-0 rounded-full bg-[var(--color-burgundy)]/10 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-[var(--color-burgundy)]">
              Sold Out
            </span>
          )}
        </div>
        {wine.varietal && <p className="mt-0.5 text-xs text-[var(--color-charcoal)]/55">{wine.varietal}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="h-8 rounded-full border border-[var(--color-line)] px-3 text-xs font-medium text-[var(--color-charcoal)]/70 hover:border-[var(--color-gold)]"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          aria-label={`Delete ${wine.name}`}
          className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-charcoal)]/40 hover:bg-black/5 hover:text-[var(--color-burgundy)]"
        >
          <Trash2 size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

export function WineryWinesManager({ wineryId, wines }: { wineryId: string; wines: Wine[] }) {
  const [draft, setDraft] = useState<WineInput>(toInput());
  const [adding, setAdding] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submitNew() {
    setError(null);
    startTransition(async () => {
      const result = await createWineAction(wineryId, draft);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setDraft(toInput());
      setAdding(false);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {adding ? (
        <div className="rounded-2xl border border-[var(--color-gold)]/40 bg-white p-4">
          <WineFields value={draft} onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))} />
          {error && <p className="mt-2 text-xs text-[var(--color-burgundy)]">{error}</p>}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={submitNew}
              disabled={pending}
              className="h-9 rounded-full bg-[var(--color-burgundy)] px-4 text-xs font-medium text-white disabled:opacity-60"
            >
              {pending ? "Adding…" : "Add Wine"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setDraft(toInput());
              }}
              className="h-9 rounded-full border border-[var(--color-line)] px-4 text-xs font-medium text-[var(--color-charcoal)]/70"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="h-10 rounded-full border border-dashed border-[var(--color-line)] text-sm font-medium text-[var(--color-charcoal)]/70 hover:border-[var(--color-gold)]"
        >
          + Add Wine
        </button>
      )}

      {wines.length === 0 ? (
        <p className="text-sm text-[var(--color-charcoal)]/50">No wines yet.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {wines.map((w) => (
            <WineRow key={w.id} wineryId={wineryId} wine={w} />
          ))}
        </div>
      )}
    </div>
  );
}
