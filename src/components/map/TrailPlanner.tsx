"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { LinkButton } from "@/components/ui/Button";
import { DirectionsButton } from "@/components/winery/DirectionsButton";
import { WineryImage } from "@/components/winery/WineryImage";
import { estimateTrailLegs } from "@/lib/trail";
import { cn } from "@/lib/utils";
import type { WineryWithStatus } from "@/lib/types";

export function TrailPlanner({ wineries }: { wineries: WineryWithStatus[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(
    wineries.find((w) => w.status === "not_visited")?.id ?? null
  );
  const legs = estimateTrailLegs(wineries);

  return (
    <div className="flex flex-col">
      {wineries.map((winery, i) => {
        const leg = legs[i - 1];
        const selected = winery.id === selectedId;
        return (
          <div key={winery.id}>
            {i > 0 && leg && (
              <div className="flex items-center gap-3 py-2 pl-8 text-xs text-[var(--color-charcoal)]/45">
                <span className="h-8 w-px bg-[var(--color-line)]" />
                ~{leg.minutes} min drive · {leg.miles.toFixed(1)} mi
              </div>
            )}
            <button
              type="button"
              onClick={() => setSelectedId(winery.id)}
              aria-pressed={selected}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors",
                selected
                  ? "border-[var(--color-gold)] bg-[var(--color-gold-pale)]/30"
                  : "border-[var(--color-line)] bg-white/50"
              )}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-burgundy)] text-xs font-semibold text-white">
                {i + 1}
              </span>
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                <WineryImage name={winery.name} slug={winery.slug} src={winery.hero_image} rows={false} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--color-charcoal)]">
                  {winery.name}
                </p>
                <p className="text-xs text-[var(--color-charcoal)]/55">
                  {winery.city}, TN ·{" "}
                  {winery.status === "not_visited" ? "Not Visited" : "Visited"}
                </p>
              </div>
            </button>

            {selected && (
              <div className="mt-2 grid grid-cols-2 gap-2 pb-3 pl-10">
                <LinkButton href={`/winery/${winery.slug}`} variant="outline" size="sm" fullWidth>
                  View Winery
                  <ArrowRight size={14} />
                </LinkButton>
                <DirectionsButton
                  lat={winery.latitude}
                  lon={winery.longitude}
                  label={winery.name}
                  variant="primary"
                  size="sm"
                  fullWidth
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
