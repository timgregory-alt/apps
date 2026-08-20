"use client";

import { useState, useTransition } from "react";
import { setWineSoldOutAction } from "@/app/admin/wineries/actions";
import { STYLE_BADGE } from "@/lib/recommendations";
import type { Wine } from "@/lib/types";

export function WineSoldOutList({ wineryId, wines }: { wineryId: string; wines: Wine[] }) {
  const [soldOutById, setSoldOutById] = useState<Record<string, boolean>>(
    Object.fromEntries(wines.map((w) => [w.id, w.sold_out]))
  );
  const [, startTransition] = useTransition();

  function handleToggle(wineId: string, checked: boolean) {
    setSoldOutById((prev) => ({ ...prev, [wineId]: checked }));
    startTransition(async () => {
      const result = await setWineSoldOutAction(wineId, wineryId, checked);
      if (result?.error) {
        setSoldOutById((prev) => ({ ...prev, [wineId]: !checked }));
      }
    });
  }

  if (wines.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
      <p className="text-sm font-medium text-[var(--color-charcoal)]">Wines</p>
      <p className="mt-1 text-xs text-[var(--color-charcoal)]/55">
        Mark a wine sold out to gray it out and label it on the app — it stays visible so guests
        can still read tasting notes and see past ratings.
      </p>

      <div className="mt-4 flex flex-col divide-y divide-[var(--color-line)]">
        {wines.map((wine) => (
          <label
            key={wine.id}
            className="flex items-center justify-between gap-3 py-2.5 text-sm first:pt-0 last:pb-0"
          >
            <span className="flex items-center gap-2 truncate">
              <span className="truncate text-[var(--color-charcoal)]">{wine.name}</span>
              <span className="shrink-0 rounded-full bg-black/5 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-[var(--color-charcoal)]/55">
                {STYLE_BADGE[wine.style]}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-2 text-xs text-[var(--color-charcoal)]/60">
              Sold Out
              <input
                type="checkbox"
                checked={soldOutById[wine.id] ?? false}
                onChange={(e) => handleToggle(wine.id, e.target.checked)}
                className="h-4 w-4"
              />
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
