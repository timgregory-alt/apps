"use client";

import { useState, useTransition } from "react";
import { Trash2, Sparkles } from "lucide-react";
import {
  createWineryEventAction,
  updateWineryEventAction,
  deleteWineryEventAction,
  type EventInput,
} from "@/app/portal/events/actions";
import type { WineryEvent } from "@/lib/types";

const inputClass =
  "h-10 w-full rounded-lg border border-[var(--color-line)] bg-white px-2.5 text-sm outline-none focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold)]/25";
const labelTextClass = "text-xs font-medium uppercase tracking-wide text-[var(--color-charcoal)]/50";

function toInput(e?: WineryEvent): EventInput {
  return {
    title: e?.title ?? "",
    description: e?.description ?? "",
    event_date: e?.event_date ?? "",
    event_time: e?.event_time ?? "",
    ticket_url: e?.ticket_url ?? "",
    vip_only: e?.vip_only ?? false,
  };
}

function EventFields({
  value,
  onChange,
}: {
  value: EventInput;
  onChange: (patch: Partial<EventInput>) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <label className="col-span-2 flex flex-col gap-1">
        <span className={labelTextClass}>Title</span>
        <input
          value={value.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className={inputClass}
        />
      </label>
      <label className="col-span-2 flex flex-col gap-1">
        <span className={labelTextClass}>Description</span>
        <textarea
          value={value.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={2}
          className="w-full rounded-lg border border-[var(--color-line)] bg-white px-2.5 py-2 text-sm outline-none focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold)]/25"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className={labelTextClass}>Date</span>
        <input
          type="date"
          value={value.event_date}
          onChange={(e) => onChange({ event_date: e.target.value })}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className={labelTextClass}>Time</span>
        <input
          placeholder="e.g. 6:00 PM – 9:00 PM"
          value={value.event_time}
          onChange={(e) => onChange({ event_time: e.target.value })}
          className={inputClass}
        />
      </label>
      <label className="col-span-2 flex flex-col gap-1">
        <span className={labelTextClass}>Ticket / RSVP Link</span>
        <input
          placeholder="https://…"
          value={value.ticket_url}
          onChange={(e) => onChange({ ticket_url: e.target.value })}
          className={inputClass}
        />
      </label>
      <label className="col-span-2 flex items-center gap-2 text-sm text-[var(--color-charcoal)]">
        <input
          type="checkbox"
          checked={value.vip_only}
          onChange={(e) => onChange({ vip_only: e.target.checked })}
          className="h-4 w-4"
        />
        VIP event — subscribers get early access, shown on the VIP page
      </label>
    </div>
  );
}

function EventRow({ wineryId, event }: { wineryId: string; event: WineryEvent }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<EventInput>(toInput(event));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await updateWineryEventAction(wineryId, event.id, draft);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setEditing(false);
    });
  }

  function remove() {
    if (!confirm(`Delete "${event.title}"?`)) return;
    startTransition(async () => {
      await deleteWineryEventAction(wineryId, event.id);
    });
  }

  if (editing) {
    return (
      <div className="rounded-2xl border border-[var(--color-gold)]/40 bg-white p-4">
        <EventFields value={draft} onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))} />
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
              setDraft(toInput(event));
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
          {event.vip_only && <Sparkles size={13} className="shrink-0 text-[var(--color-gold)]" />}
          <p className="truncate text-sm font-medium text-[var(--color-charcoal)]">{event.title}</p>
        </div>
        <p className="mt-0.5 text-xs text-[var(--color-charcoal)]/55">
          {event.event_date}
          {event.event_time ? ` · ${event.event_time}` : ""}
        </p>
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
          aria-label={`Delete ${event.title}`}
          className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-charcoal)]/40 hover:bg-black/5 hover:text-[var(--color-burgundy)]"
        >
          <Trash2 size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

export function WineryEventsManager({ wineryId, events }: { wineryId: string; events: WineryEvent[] }) {
  const [draft, setDraft] = useState<EventInput>(toInput());
  const [adding, setAdding] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submitNew() {
    setError(null);
    startTransition(async () => {
      const result = await createWineryEventAction(wineryId, draft);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setDraft(toInput());
      setAdding(false);
    });
  }

  const sorted = [...events].sort((a, b) => a.event_date.localeCompare(b.event_date));

  return (
    <div className="flex flex-col gap-4">
      {adding ? (
        <div className="rounded-2xl border border-[var(--color-gold)]/40 bg-white p-4">
          <EventFields value={draft} onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))} />
          {error && <p className="mt-2 text-xs text-[var(--color-burgundy)]">{error}</p>}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={submitNew}
              disabled={pending}
              className="h-9 rounded-full bg-[var(--color-burgundy)] px-4 text-xs font-medium text-white disabled:opacity-60"
            >
              {pending ? "Adding…" : "Add Event"}
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
          + Add Event
        </button>
      )}

      {sorted.length === 0 ? (
        <p className="text-sm text-[var(--color-charcoal)]/50">No events yet.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {sorted.map((e) => (
            <EventRow key={e.id} wineryId={wineryId} event={e} />
          ))}
        </div>
      )}
    </div>
  );
}
