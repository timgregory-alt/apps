"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ThumbsUp, ThumbsDown, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { STYLE_BADGE } from "@/lib/recommendations";
import { cn } from "@/lib/utils";
import type { WineStyle } from "@/lib/types";

const STYLES: WineStyle[] = ["red", "white", "rose", "sweet", "sparkling"];

export function AddWineCard({
  isLoggedIn,
  redirectTo,
  onAdd,
}: {
  isLoggedIn: boolean;
  redirectTo: string;
  onAdd: (input: { name: string; style: WineStyle; notes: string; liked: boolean }) => Promise<void>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [style, setStyle] = useState<WineStyle>("red");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function startAdding() {
    if (!isLoggedIn) {
      router.push(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
      return;
    }
    setOpen(true);
  }

  function reset() {
    setOpen(false);
    setName("");
    setStyle("red");
    setNotes("");
  }

  async function handleSubmit(liked: boolean) {
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onAdd({ name: name.trim(), style, notes: notes.trim(), liked });
      reset();
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={startAdding}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--color-gold)]/50 bg-white/30 px-4 py-4 text-sm font-medium text-[var(--color-burgundy)] transition-colors hover:bg-white/50"
      >
        <Plus size={16} strokeWidth={2} />
        Add a Wine You Tried
      </button>
    );
  }

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <p className="font-serif-display text-base text-[var(--color-charcoal)]">Add a Wine</p>
        <button
          type="button"
          onClick={reset}
          aria-label="Cancel"
          className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--color-charcoal)]/50 hover:bg-black/5"
        >
          <X size={15} />
        </button>
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-charcoal)]/50">
          Wine name
        </span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Reserve Merlot"
          maxLength={80}
          className="h-11 rounded-lg border border-[var(--color-line)] bg-white px-3 text-sm outline-none focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold)]/25"
        />
      </label>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-charcoal)]/50">
          Style
        </span>
        <div className="flex flex-wrap gap-1.5">
          {STYLES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStyle(s)}
              aria-pressed={style === s}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                style === s
                  ? "border-[var(--color-gold)] bg-[var(--color-gold-pale)]/60 text-[var(--color-charcoal)]"
                  : "border-[var(--color-line)] text-[var(--color-charcoal)]/60 hover:border-[var(--color-gold)]"
              )}
            >
              {STYLE_BADGE[s]}
            </button>
          ))}
        </div>
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-charcoal)]/50">
          Notes (optional)
        </span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What did it taste like?"
          maxLength={280}
          rows={2}
          className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold)]/25"
        />
      </label>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => handleSubmit(true)}
          disabled={!name.trim() || submitting}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[var(--color-gold)] px-3 py-2 text-xs font-medium text-[var(--color-charcoal)] disabled:opacity-50"
        >
          <ThumbsUp size={13} strokeWidth={2} />
          Liked It
        </button>
        <button
          type="button"
          onClick={() => handleSubmit(false)}
          disabled={!name.trim() || submitting}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[var(--color-line)] px-3 py-2 text-xs font-medium text-[var(--color-charcoal)]/70 disabled:opacity-50"
        >
          <ThumbsDown size={13} strokeWidth={2} />
          Not for me
        </button>
      </div>
    </Card>
  );
}
