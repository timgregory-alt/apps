"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { RewardTierCard } from "@/components/rewards/RewardTierCard";
import { cn } from "@/lib/utils";
import type { RewardRedemption, RewardTier } from "@/lib/types";

export function RewardTierCarousel({
  tiers,
  pointsTotal,
  redemptionByTier,
}: {
  tiers: RewardTier[];
  pointsTotal: number;
  redemptionByTier: Map<string, RewardRedemption>;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    function onScroll() {
      const { scrollLeft, clientWidth } = track!;
      setActiveIndex(Math.round(scrollLeft / clientWidth));
    }
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, []);

  function scrollToIndex(index: number) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tiers.map((tier) => (
          <div key={tier.id} className="w-full shrink-0 snap-center">
            <RewardTierCard
              tier={tier}
              pointsTotal={pointsTotal}
              redemption={redemptionByTier.get(tier.id) ?? null}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          aria-label="Previous reward"
          onClick={() => scrollToIndex(Math.max(0, activeIndex - 1))}
          disabled={activeIndex === 0}
          className="text-[var(--color-charcoal)]/50 disabled:opacity-25"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex items-center gap-1.5">
          {tiers.map((tier, i) => (
            <button
              key={tier.id}
              type="button"
              aria-label={`Show ${tier.label}`}
              onClick={() => scrollToIndex(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === activeIndex ? "w-5 bg-[var(--color-burgundy)]" : "w-1.5 bg-[var(--color-charcoal)]/20"
              )}
            />
          ))}
        </div>

        <button
          type="button"
          aria-label="Next reward"
          onClick={() => scrollToIndex(Math.min(tiers.length - 1, activeIndex + 1))}
          disabled={activeIndex === tiers.length - 1}
          className="text-[var(--color-charcoal)]/50 disabled:opacity-25"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <p className="text-center text-xs text-[var(--color-charcoal)]/45">
        {activeIndex + 1} of {tiers.length} rewards
      </p>
    </div>
  );
}
