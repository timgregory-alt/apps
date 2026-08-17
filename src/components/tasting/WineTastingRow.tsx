"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Wine as WineIcon, Check, ChevronDown, RotateCcw, UtensilsCrossed } from "lucide-react";
import { STYLE_BADGE } from "@/lib/recommendations";
import { StarRating } from "@/components/ui/StarRating";
import type { WineWithTasting } from "@/lib/types";
import { cn, isRecentlyAdded } from "@/lib/utils";

/** Collapsed by default as a compact row; tap to grow into a flip card —
 * front shows just the wine name, tap to reveal the back with full tasting
 * notes, food pairing, and a 1-5 star rating. Rating does not flip the card
 * back — only the flip-back button (the half-circle arrow) does, so someone
 * can change their mind before closing it. The chevron on the front face
 * collapses back to the compact row. */
export function WineTastingRow({
  wine,
  onRate,
  pending,
}: {
  wine: WineWithTasting;
  onRate: (rating: number) => void;
  pending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const rated = wine.tasting != null;
  const isNew = isRecentlyAdded(wine.created_at);
  const soldOut = wine.sold_out;

  function close() {
    setOpen(false);
    setFlipped(false);
  }

  return (
    <motion.div
      animate={{ height: open ? "18rem" : "4.75rem" }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden [perspective:1200px]"
    >
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`${wine.name}${soldOut ? " — sold out" : ""} — tap to open`}
          className={cn(
            "flex h-[4.75rem] w-full items-center gap-3 rounded-2xl border border-[var(--color-line)] bg-white/70 px-4 text-left backdrop-blur-sm",
            soldOut && "grayscale opacity-60"
          )}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-gold-pale)]/50">
            <WineIcon size={17} className="text-[var(--color-burgundy)]" strokeWidth={1.5} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-serif-display truncate text-base leading-tight text-[var(--color-charcoal)]">
              {wine.name}
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="rounded-full bg-black/5 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-[var(--color-charcoal)]/60">
                {STYLE_BADGE[wine.style]}
              </span>
              {soldOut && (
                <span className="rounded-full bg-[var(--color-charcoal)] px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-white">
                  Sold Out
                </span>
              )}
              {!soldOut && isNew && (
                <span className="rounded-full bg-[var(--color-burgundy)] px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-white">
                  New
                </span>
              )}
              {rated && (
                <span className="flex items-center gap-0.5 text-[0.65rem] text-[var(--color-charcoal)]/40">
                  <Check size={11} strokeWidth={2.5} />
                  Tasted
                </span>
              )}
            </div>
          </div>
          <ChevronDown
            size={16}
            strokeWidth={2.5}
            className="shrink-0 text-[var(--color-charcoal)]/35"
          />
        </button>
      ) : (
        <motion.div
          className="relative h-full w-full [transform-style:preserve-3d]"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Front */}
          <button
            type="button"
            onClick={() => setFlipped(true)}
            aria-label={`${wine.name}${soldOut ? " — sold out" : ""} — tap to see tasting notes and food pairing`}
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl border border-[var(--color-line)] bg-white/70 p-6 text-center backdrop-blur-sm [backface-visibility:hidden]",
              soldOut && "grayscale opacity-60"
            )}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                close();
              }}
              aria-label="Collapse"
              className="absolute left-1/2 top-3 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full text-[var(--color-charcoal)]/35 hover:bg-black/5"
            >
              <ChevronDown size={15} strokeWidth={2.5} className="rotate-180" />
            </button>
            {rated && (
              <span className="absolute right-4 top-4 flex items-center gap-1 text-xs text-[var(--color-charcoal)]/40">
                <Check size={13} strokeWidth={2.5} />
                Tasted
              </span>
            )}
            {soldOut ? (
              <span className="absolute left-4 top-4 rounded-full bg-[var(--color-charcoal)] px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-white">
                Sold Out
              </span>
            ) : (
              isNew && (
                <span className="absolute left-4 top-4 rounded-full bg-[var(--color-burgundy)] px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-white">
                  New
                </span>
              )
            )}
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-gold-pale)]/50">
              <WineIcon size={20} className="text-[var(--color-burgundy)]" strokeWidth={1.5} />
            </span>
            <p className="font-serif-display text-xl leading-tight text-[var(--color-charcoal)]">
              {wine.name}
            </p>
            <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-[var(--color-charcoal)]/60">
              {STYLE_BADGE[wine.style]}
            </span>
            <p className="text-xs text-[var(--color-charcoal)]/40">
              {soldOut ? "Sold out — tap to see tasting notes" : "Tap to see tasting notes"}
            </p>
          </button>

          {/* Back */}
          <div
            className="absolute inset-0 flex flex-col rounded-3xl border border-[var(--color-line)] bg-white/70 p-4 backdrop-blur-sm [backface-visibility:hidden] [transform:rotateY(180deg)]"
          >
            <button
              type="button"
              onClick={() => setFlipped(false)}
              aria-label="Flip back"
              className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-[var(--color-charcoal)]/40 hover:bg-black/5"
            >
              <RotateCcw size={14} strokeWidth={2} />
            </button>

            <div className="pr-8">
              <p className="font-serif-display text-lg leading-tight text-[var(--color-charcoal)]">
                {wine.name}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="rounded-full bg-black/5 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-[var(--color-charcoal)]/60">
                  {STYLE_BADGE[wine.style]}
                </span>
                <p className="truncate text-xs text-[var(--color-charcoal)]/55">
                  {wine.varietal} · {wine.winery.name}
                </p>
              </div>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-[var(--color-charcoal)]/70">
              {wine.tasting_notes}
            </p>

            {wine.food_pairing && (
              <p className="mt-2 flex items-start gap-1.5 text-xs text-[var(--color-charcoal)]/60">
                <UtensilsCrossed
                  size={13}
                  strokeWidth={1.75}
                  className="mt-0.5 shrink-0 text-[var(--color-gold)]"
                />
                Pairs with: {wine.food_pairing}
              </p>
            )}

            <div className="mt-auto flex flex-col items-center gap-1.5 pt-3">
              <p className="text-xs text-[var(--color-charcoal)]/50">
                {wine.tasting ? "Your rating" : "How was it?"}
              </p>
              <StarRating
                value={wine.tasting?.rating ?? 0}
                onRate={onRate}
                disabled={pending}
              />
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
