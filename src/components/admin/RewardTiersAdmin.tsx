"use client";

import { useState, useTransition } from "react";
import { createRewardTierAction, updateRewardTierAction } from "@/app/admin/rewards/actions";
import type { RewardTier } from "@/lib/types";

interface DraftTier {
  id: string;
  label: string;
  points_required: number;
  discount_percent: number;
  /** One choice option per line; blank means a plain discount tier. */
  choiceOptionsText: string;
  birthday_only: boolean;
  sort_order: number;
  active: boolean;
}

function toDraft(t: RewardTier): DraftTier {
  return {
    id: t.id,
    label: t.label,
    points_required: t.points_required,
    discount_percent: t.discount_percent,
    choiceOptionsText: (t.choice_options ?? []).join("\n"),
    birthday_only: t.birthday_only,
    sort_order: t.sort_order,
    active: t.active,
  };
}

function parseChoiceOptions(text: string): string[] | null {
  const options = text
    .split("\n")
    .map((o) => o.trim())
    .filter(Boolean);
  return options.length > 0 ? options : null;
}

const inputClass =
  "rounded-lg border border-[var(--color-line)] bg-[var(--color-ivory)] px-2.5 py-1.5 text-sm text-[var(--color-charcoal)] outline-none focus:border-[var(--color-gold)]";

export function RewardTiersAdmin({ tiers }: { tiers: RewardTier[] }) {
  const [rows, setRows] = useState<DraftTier[]>(tiers.map(toDraft));
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const [newTier, setNewTier] = useState({
    label: "",
    points_required: 100,
    discount_percent: 10,
    choiceOptionsText: "",
    birthday_only: false,
    sort_order: rows.length + 1,
    active: true,
  });

  function updateRow(id: string, patch: Partial<DraftTier>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function saveRow(id: string) {
    const row = rows.find((r) => r.id === id);
    if (!row) return;
    setError(null);
    setSavingId(id);
    startTransition(async () => {
      const result = await updateRewardTierAction(id, {
        label: row.label.trim(),
        points_required: row.points_required,
        discount_percent: row.discount_percent,
        choice_options: parseChoiceOptions(row.choiceOptionsText),
        birthday_only: row.birthday_only,
        sort_order: row.sort_order,
        active: row.active,
      });
      if (result?.error) setError(result.error);
      setSavingId(null);
    });
  }

  function addTier(e: React.FormEvent) {
    e.preventDefault();
    if (!newTier.label.trim()) return;
    setError(null);
    setCreating(true);
    startTransition(async () => {
      const created = await createRewardTierAction({
        label: newTier.label.trim(),
        points_required: newTier.points_required,
        discount_percent: newTier.discount_percent,
        choice_options: parseChoiceOptions(newTier.choiceOptionsText),
        birthday_only: newTier.birthday_only,
        sort_order: newTier.sort_order,
        active: newTier.active,
      });
      if ("error" in created) {
        setError(created.error);
      } else {
        setRows((prev) => [...prev, toDraft(created)]);
        setNewTier({
          label: "",
          points_required: 100,
          discount_percent: 10,
          choiceOptionsText: "",
          birthday_only: false,
          sort_order: rows.length + 2,
          active: true,
        });
      }
      setCreating(false);
    });
  }

  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
      <p className="text-sm font-medium text-[var(--color-charcoal)]">Reward Tiers</p>
      <p className="mt-1 text-xs text-[var(--color-charcoal)]/55">
        Guests unlock a one-time redemption code once their points reach a tier&apos;s threshold.
        &ldquo;Birthday only&rdquo; tiers skip the points requirement entirely and only unlock
        (once per year) on the guest&apos;s actual birthday — they&apos;re never shown in the
        regular rewards list. Deactivate a tier instead of deleting it — redemptions already
        issued reference it.
      </p>

      {error && <p className="mt-3 text-xs text-[var(--color-burgundy)]">{error}</p>}

      <div className="mt-4 flex flex-col gap-3">
        {rows.map((row) => (
          <div
            key={row.id}
            className="grid grid-cols-2 gap-2 rounded-xl border border-[var(--color-line)] p-3 sm:grid-cols-6 sm:items-center"
          >
            <label className="col-span-2 flex flex-col gap-1 sm:col-span-2">
              <span className="text-[0.65rem] uppercase tracking-wide text-[var(--color-charcoal)]/45">
                Label
              </span>
              <input
                value={row.label}
                onChange={(e) => updateRow(row.id, { label: e.target.value })}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[0.65rem] uppercase tracking-wide text-[var(--color-charcoal)]/45">
                Points
              </span>
              <input
                type="number"
                min={1}
                value={row.points_required}
                onChange={(e) => updateRow(row.id, { points_required: Number(e.target.value) })}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[0.65rem] uppercase tracking-wide text-[var(--color-charcoal)]/45">
                Discount %
              </span>
              <input
                type="number"
                min={1}
                max={100}
                value={row.discount_percent}
                onChange={(e) => updateRow(row.id, { discount_percent: Number(e.target.value) })}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[0.65rem] uppercase tracking-wide text-[var(--color-charcoal)]/45">
                Order
              </span>
              <input
                type="number"
                value={row.sort_order}
                onChange={(e) => updateRow(row.id, { sort_order: Number(e.target.value) })}
                className={inputClass}
              />
            </label>
            <label className="col-span-2 flex flex-col gap-1 sm:col-span-6">
              <span className="text-[0.65rem] uppercase tracking-wide text-[var(--color-charcoal)]/45">
                Choice Options (one per line — leave blank for a plain {row.discount_percent}% discount tier)
              </span>
              <textarea
                value={row.choiceOptionsText}
                onChange={(e) => updateRow(row.id, { choiceOptionsText: e.target.value })}
                rows={2}
                placeholder={"e.g. 35% off your next purchase\nA complimentary tasting for two"}
                className={`${inputClass} resize-y`}
              />
            </label>
            <div className="col-span-2 flex items-center justify-between gap-2 sm:col-span-6 sm:justify-end">
              <label className="flex items-center gap-1.5 text-xs text-[var(--color-charcoal)]/70">
                <input
                  type="checkbox"
                  checked={row.birthday_only}
                  onChange={(e) => updateRow(row.id, { birthday_only: e.target.checked })}
                  className="h-4 w-4"
                />
                Birthday only
              </label>
              <label className="flex items-center gap-1.5 text-xs text-[var(--color-charcoal)]/70">
                <input
                  type="checkbox"
                  checked={row.active}
                  onChange={(e) => updateRow(row.id, { active: e.target.checked })}
                  className="h-4 w-4"
                />
                Active
              </label>
              <button
                type="button"
                onClick={() => saveRow(row.id)}
                disabled={savingId === row.id}
                className="rounded-full bg-[var(--color-burgundy)] px-3 py-1.5 text-xs font-medium text-[var(--color-ivory)] disabled:opacity-50"
              >
                {savingId === row.id ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={addTier}
        className="mt-5 grid grid-cols-2 gap-2 rounded-xl border border-dashed border-[var(--color-line)] p-3 sm:grid-cols-6 sm:items-end"
      >
        <label className="col-span-2 flex flex-col gap-1 sm:col-span-2">
          <span className="text-[0.65rem] uppercase tracking-wide text-[var(--color-charcoal)]/45">
            New Tier Label
          </span>
          <input
            value={newTier.label}
            onChange={(e) => setNewTier((p) => ({ ...p, label: e.target.value }))}
            placeholder="e.g. 300 Points — Free Tasting"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[0.65rem] uppercase tracking-wide text-[var(--color-charcoal)]/45">
            Points
          </span>
          <input
            type="number"
            min={1}
            value={newTier.points_required}
            onChange={(e) => setNewTier((p) => ({ ...p, points_required: Number(e.target.value) }))}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[0.65rem] uppercase tracking-wide text-[var(--color-charcoal)]/45">
            Discount %
          </span>
          <input
            type="number"
            min={1}
            max={100}
            value={newTier.discount_percent}
            onChange={(e) => setNewTier((p) => ({ ...p, discount_percent: Number(e.target.value) }))}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[0.65rem] uppercase tracking-wide text-[var(--color-charcoal)]/45">
            Order
          </span>
          <input
            type="number"
            value={newTier.sort_order}
            onChange={(e) => setNewTier((p) => ({ ...p, sort_order: Number(e.target.value) }))}
            className={inputClass}
          />
        </label>
        <label className="col-span-2 flex flex-col gap-1 sm:col-span-6">
          <span className="text-[0.65rem] uppercase tracking-wide text-[var(--color-charcoal)]/45">
            Choice Options (one per line — leave blank for a plain discount tier)
          </span>
          <textarea
            value={newTier.choiceOptionsText}
            onChange={(e) => setNewTier((p) => ({ ...p, choiceOptionsText: e.target.value }))}
            rows={2}
            placeholder={"e.g. 35% off your next purchase\nA complimentary tasting for two"}
            className={`${inputClass} resize-y`}
          />
        </label>
        <label className="flex items-center gap-1.5 text-xs text-[var(--color-charcoal)]/70">
          <input
            type="checkbox"
            checked={newTier.birthday_only}
            onChange={(e) => setNewTier((p) => ({ ...p, birthday_only: e.target.checked }))}
            className="h-4 w-4"
          />
          Birthday only
        </label>
        <button
          type="submit"
          disabled={creating || !newTier.label.trim()}
          className="rounded-full bg-[var(--color-gold)] px-3 py-1.5 text-xs font-medium text-[var(--color-charcoal)] disabled:opacity-50"
        >
          {creating ? "Adding…" : "Add Tier"}
        </button>
      </form>
    </div>
  );
}
