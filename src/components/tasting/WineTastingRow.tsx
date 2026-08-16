"use client";

import { motion } from "framer-motion";
import { Wine as WineIcon, ThumbsUp, ThumbsDown, Check } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { STYLE_BADGE } from "@/lib/recommendations";
import type { WineWithTasting } from "@/lib/types";
import { cn } from "@/lib/utils";

export function WineTastingRow({
  wine,
  onRate,
  pending,
}: {
  wine: WineWithTasting;
  onRate: (liked: boolean) => void;
  pending: boolean;
}) {
  const rated = wine.tasting != null;

  return (
    <Card className="overflow-hidden p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-gold-pale)]/50">
          <WineIcon size={17} className="text-[var(--color-burgundy)]" strokeWidth={1.5} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-serif-display truncate text-base leading-tight text-[var(--color-charcoal)]">
                {wine.name}
              </p>
              <p className="mt-0.5 text-xs text-[var(--color-charcoal)]/55">
                {wine.varietal} · {wine.winery.name}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-black/5 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-[var(--color-charcoal)]/60">
              {STYLE_BADGE[wine.style]}
            </span>
          </div>

          <p className="mt-2 text-sm leading-relaxed text-[var(--color-charcoal)]/70">
            {wine.tasting_notes}
          </p>

          <div className="mt-3 flex items-center gap-2">
            <RateButton
              active={wine.tasting?.liked === true}
              onClick={() => onRate(true)}
              disabled={pending}
              icon={ThumbsUp}
              label="Liked it"
              activeClass="bg-[var(--color-gold)] text-[var(--color-charcoal)] border-[var(--color-gold)]"
            />
            <RateButton
              active={wine.tasting?.liked === false}
              onClick={() => onRate(false)}
              disabled={pending}
              icon={ThumbsDown}
              label="Not for me"
              activeClass="bg-black/10 text-[var(--color-charcoal)]/70 border-black/10"
            />
            {rated && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="ml-auto flex items-center gap-1 text-xs text-[var(--color-charcoal)]/40"
              >
                <Check size={13} strokeWidth={2.5} />
                Tasted
              </motion.span>
            )}
          </div>
        </div>
      </div>
    </Card>
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
