"use client";

import { useTransition } from "react";
import { setActivePortalWineryAction } from "@/app/portal/actions";
import type { Winery } from "@/lib/types";

/** Shown in the portal header only when a login has access to more than
 * one winery (e.g. Big Creek's two locations) — lets staff switch which
 * one the whole portal is currently managing. */
export function WinerySwitcher({ wineries, activeId }: { wineries: Winery[]; activeId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      value={activeId}
      disabled={pending}
      onChange={(e) => {
        const wineryId = e.target.value;
        startTransition(async () => {
          await setActivePortalWineryAction(wineryId);
        });
      }}
      className="rounded-full border border-[var(--color-ivory)]/25 bg-transparent px-3 py-1 font-serif-display text-lg text-[var(--color-ivory)] outline-none disabled:opacity-60"
    >
      {wineries.map((w) => (
        <option key={w.id} value={w.id} className="text-[var(--color-charcoal)]">
          {w.name}
        </option>
      ))}
    </select>
  );
}
