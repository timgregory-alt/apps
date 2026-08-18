"use client";

import { useState } from "react";
import { ChevronDown, Clock, MapPin } from "lucide-react";
import { WineryHoursRow } from "@/components/winery/WineryHoursRow";
import { cn } from "@/lib/utils";
import type { Winery, WineryHours } from "@/lib/types";

export function WineryDetailsList({
  winery,
  hoursSeasons = [],
}: {
  winery: Winery;
  hoursSeasons?: WineryHours[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white/60">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3.5"
        aria-expanded={open}
      >
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-charcoal)]/45">
          Winery Info
        </span>
        <ChevronDown
          size={15}
          strokeWidth={2.5}
          className={cn(
            "shrink-0 text-[var(--color-charcoal)]/45 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <dl className="flex flex-col divide-y divide-[var(--color-line)] border-t border-[var(--color-line)]">
          <Row icon={MapPin} label="Address" value={winery.address} />
          <WineryHoursRow fallbackHours={winery.hours} seasons={hoursSeasons} />
          {winery.phone && <Row icon={Clock} label="Phone" value={winery.phone} />}
        </dl>
      )}
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-3.5">
      <Icon size={17} strokeWidth={1.75} className="mt-0.5 shrink-0 text-[var(--color-gold)]" />
      <div className="min-w-0">
        <dt className="text-[0.68rem] font-medium uppercase tracking-[0.14em] text-[var(--color-charcoal)]/45">
          {label}
        </dt>
        <dd className="mt-0.5 text-sm text-[var(--color-charcoal)]/85">{value}</dd>
      </div>
    </div>
  );
}
