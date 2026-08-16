"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Wine as WineIcon,
  ThumbsUp,
  ThumbsDown,
  Check,
  RotateCcw,
  UtensilsCrossed,
} from "lucide-react";
import { STYLE_BADGE } from "@/lib/recommendations";
import type { WineWithTasting } from "@/lib/types";
import { cn } from "@/lib/utils";

/** A flip card: front shows just the wine name, tap to reveal the back with
 * full tasting notes, food pairing, and the rate buttons. */
export function WineTastingRow({
  wine,
  onRate,
  pending,
}: {
  wine: WineWithTasting;
  onRate: (liked: boolean) => void;
  pending: boolean;
}) {
  const [flipped, setFlipped] = useState(false);
  const rated = wine.tasting != null;

  function handleRate(liked: boolean) {
    onRate(liked);
    setFlipped(false);
  }

  return (
    <div className="h-72 [perspective:1200px]">
      <motion.div
        className="relative h-full w-full [transform-style:preserve-3d]"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Front */}
        <button
          type="button"
          onClick={() => setFlipped(true)}
          aria-label={`${wine.name} — tap to see tasting notes and food pairing`}
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl border border-[var(--color-line)] bg-white/70 p-6 text-center backdrop-blur-sm [backface-visibility:hidden]"
        >
          {rated && (
            <span className="absolute right-4 top-4 flex items-center gap-1 text-xs text-[var(--color-charcoal)]/40">
              <Check size={13} strokeWidth={2.5} />
              Tasted
            </span>
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
          <p className="text-xs text-[var(--color-charcoal)]/40">Tap to see tasting notes</p>
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

          <div className="mt-auto flex items-center gap-2 pt-3">
            <RateButton
              active={wine.tasting?.liked === true}
              onClick={() => handleRate(true)}
              disabled={pending}
              icon={ThumbsUp}
              label="Liked it"
              activeClass="bg-[var(--color-gold)] text-[var(--color-charcoal)] border-[var(--color-gold)]"
            />
            <RateButton
              active={wine.tasting?.liked === false}
              onClick={() => handleRate(false)}
              disabled={pending}
              icon={ThumbsDown}
              label="Not for me"
              activeClass="bg-black/10 text-[var(--color-charcoal)]/70 border-black/10"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function RateButton({
  active,
  onClick,
  disabled,
  icon: Icon,
  label,
  activeClass,
}: {
  active: boolean;
  onClick: () => void;
  disabled: boolean;
  icon: typeof ThumbsUp;
  label: string;
  activeClass: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
        active
          ? activeClass
          : "border-[var(--color-line)] text-[var(--color-charcoal)]/60 hover:border-[var(--color-gold)]"
      )}
    >
      <Icon size={13} strokeWidth={2} />
      {label}
    </button>
  );
}
