"use client";

import { useRef, useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { createTrailAction } from "@/app/admin/trails/actions";

export function AddTrailForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 self-start rounded-full bg-[var(--color-burgundy)] px-4 py-2.5 text-sm font-medium text-white"
      >
        <Plus size={16} />
        Add Trail
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await createTrailAction(formData);
          if (result?.error) {
            setError(result.error);
            return;
          }
          formRef.current?.reset();
          setOpen(false);
        });
      }}
      className="flex flex-col gap-3 rounded-2xl border border-[var(--color-line)] bg-white p-4"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[var(--color-charcoal)]">New Trail</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[var(--color-charcoal)]/40 hover:text-[var(--color-burgundy)]"
          aria-label="Cancel"
        >
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-charcoal)]/50">Name</span>
          <input
            name="name"
            required
            placeholder="Upper Cumberland Wine Trail"
            className="h-10 rounded-lg border border-[var(--color-line)] px-2.5 text-sm outline-none focus:border-[var(--color-gold)]"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-charcoal)]/50">Slug</span>
          <input
            name="slug"
            required
            placeholder="upper-cumberland"
            className="h-10 rounded-lg border border-[var(--color-line)] px-2.5 text-sm outline-none focus:border-[var(--color-gold)]"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-charcoal)]/50">Region</span>
          <input
            name="region"
            required
            placeholder="Upper Cumberland"
            className="h-10 rounded-lg border border-[var(--color-line)] px-2.5 text-sm outline-none focus:border-[var(--color-gold)]"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-charcoal)]/50">
            Description (optional)
          </span>
          <input
            name="description"
            placeholder="A trail through..."
            className="h-10 rounded-lg border border-[var(--color-line)] px-2.5 text-sm outline-none focus:border-[var(--color-gold)]"
          />
        </label>
      </div>

      {error && <p className="text-xs text-[var(--color-burgundy)]">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-[var(--color-burgundy)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create Trail"}
      </button>
      <p className="text-xs text-[var(--color-charcoal)]/45">
        New trails start with zero wineries and show as &ldquo;Coming soon&rdquo; until you drag some on below.
      </p>
    </form>
  );
}
