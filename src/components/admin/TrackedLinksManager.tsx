"use client";

import { useState, useTransition } from "react";
import { Check, Copy, Plus, Trash2 } from "lucide-react";
import { createTrackedLinkAction, deleteTrackedLinkAction } from "@/app/admin/links/actions";
import type { TrackedLinkWithStats } from "@/lib/admin";

const inputClass =
  "h-10 w-full rounded-lg border border-[var(--color-line)] bg-white px-2.5 text-sm outline-none focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold)]/25";

function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can fail (permissions, non-HTTPS) — not worth surfacing.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="flex shrink-0 items-center gap-1 text-xs font-medium text-[var(--color-burgundy)] hover:underline"
    >
      {copied ? <Check size={13} strokeWidth={2} /> : <Copy size={13} strokeWidth={2} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function DeleteLinkButton({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function remove() {
    setError(null);
    startTransition(async () => {
      const result = await deleteTrackedLinkAction(id);
      if (result?.error) {
        setError(result.error);
        setConfirming(false);
      }
    });
  }

  if (confirming) {
    return (
      <div className="flex shrink-0 items-center gap-1.5">
        <span className="text-xs text-[var(--color-charcoal)]/55">Delete?</span>
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="rounded-full bg-[var(--color-burgundy)] px-2.5 py-1 text-xs font-medium text-white disabled:opacity-60"
        >
          {pending ? "Deleting…" : "Confirm"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="rounded-full border border-[var(--color-line)] px-2.5 py-1 text-xs font-medium text-[var(--color-charcoal)]/60"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label="Delete tracked link"
        className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--color-charcoal)]/40 hover:bg-[var(--color-burgundy)]/10 hover:text-[var(--color-burgundy)]"
      >
        <Trash2 size={14} strokeWidth={2} />
      </button>
      {error && <p className="text-xs text-[var(--color-burgundy)]">{error}</p>}
    </div>
  );
}

export function TrackedLinksManager({ links }: { links: TrackedLinkWithStats[] }) {
  const [label, setLabel] = useState("");
  const [slug, setSlug] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createTrackedLinkAction(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setLabel("");
      setSlug("");
      setDestinationUrl("");
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
        <p className="text-sm font-medium text-[var(--color-charcoal)]">New Tracked Link</p>
        <p className="mt-1 text-xs text-[var(--color-charcoal)]/55">
          For anything printed or shared externally — a QR code, a bio link, a campaign — whose
          destination might change later, or whose clicks you want counted. The short link never
          changes; only where it points to can.
        </p>

        <form action={handleSubmit} className="mt-4 grid grid-cols-2 gap-3">
          <label className="col-span-2 flex flex-col gap-1 text-xs sm:col-span-1">
            <span className="text-[var(--color-charcoal)]/50">Label</span>
            <input
              name="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Business cards 2026"
              className={inputClass}
            />
          </label>
          <label className="col-span-2 flex flex-col gap-1 text-xs sm:col-span-1">
            <span className="text-[var(--color-charcoal)]/50">Slug (optional — from label if blank)</span>
            <input
              name="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. cards-2026"
              className={inputClass}
            />
          </label>
          <label className="col-span-2 flex flex-col gap-1 text-xs">
            <span className="text-[var(--color-charcoal)]/50">Destination URL</span>
            <input
              name="destination_url"
              value={destinationUrl}
              onChange={(e) => setDestinationUrl(e.target.value)}
              placeholder="https://winetrailonline.com"
              className={inputClass}
            />
          </label>

          {error && <p className="col-span-2 text-sm text-[var(--color-burgundy)]">{error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="col-span-2 flex h-10 items-center justify-center gap-1.5 rounded-full bg-[var(--color-charcoal)] text-sm font-medium text-white disabled:opacity-60"
          >
            <Plus size={15} strokeWidth={2} />
            {pending ? "Creating…" : "Create Link"}
          </button>
        </form>
      </div>

      {links.length === 0 ? (
        <p className="text-sm text-[var(--color-charcoal)]/45">No tracked links yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {links.map((link) => (
            <div key={link.id} className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--color-charcoal)]">{link.label}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    <p className="truncate font-mono text-xs text-[var(--color-burgundy)]">
                      {origin}/t/{link.slug}
                    </p>
                    <CopyLinkButton url={`${origin}/t/${link.slug}`} />
                  </div>
                  <p className="mt-1 truncate text-xs text-[var(--color-charcoal)]/50">
                    → {link.destination_url}
                  </p>
                </div>
                <DeleteLinkButton id={link.id} />
              </div>
              <p className="mt-2 text-xs font-medium text-[var(--color-charcoal)]/60">
                {link.totalClicks.toLocaleString()} click{link.totalClicks === 1 ? "" : "s"} all-time ·{" "}
                {link.last7DaysClicks.toLocaleString()} in the last 7 days
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
