"use client";

import { Wine as WineIcon, ThumbsUp, ThumbsDown, Trash2, UtensilsCrossed } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { STYLE_BADGE } from "@/lib/recommendations";
import type { CustomWineTasting } from "@/lib/types";

export function CustomWineRow({
  tasting,
  onDelete,
  pending,
}: {
  tasting: CustomWineTasting;
  onDelete: () => void;
  pending: boolean;
}) {
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
                {tasting.name}
              </p>
              <p className="mt-0.5 text-xs text-[var(--color-charcoal)]/55">Added by you</p>
            </div>
            <span className="shrink-0 rounded-full bg-black/5 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-[var(--color-charcoal)]/60">
              {STYLE_BADGE[tasting.style]}
            </span>
          </div>

          {tasting.notes && (
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-charcoal)]/70">
              {tasting.notes}
            </p>
          )}

          {tasting.food_pairing && (
            <p className="mt-2 flex items-start gap-1.5 text-xs text-[var(--color-charcoal)]/55">
              <UtensilsCrossed size={13} strokeWidth={1.75} className="mt-0.5 shrink-0 text-[var(--color-gold)]" />
              {tasting.food_pairing}
            </p>
          )}

          <div className="mt-3 flex items-center gap-2">
            <span
              className={
                tasting.liked
                  ? "flex items-center gap-1.5 rounded-full border border-[var(--color-gold)] bg-[var(--color-gold)] px-3 py-1.5 text-xs font-medium text-[var(--color-charcoal)]"
                  : "flex items-center gap-1.5 rounded-full border border-black/10 bg-black/10 px-3 py-1.5 text-xs font-medium text-[var(--color-charcoal)]/70"
              }
            >
              {tasting.liked ? (
                <ThumbsUp size={13} strokeWidth={2} />
              ) : (
                <ThumbsDown size={13} strokeWidth={2} />
              )}
              {tasting.liked ? "Liked it" : "Not for me"}
            </span>

            <button
              type="button"
              onClick={onDelete}
              disabled={pending}
              aria-label={`Remove ${tasting.name}`}
              className="ml-auto flex items-center gap-1 text-xs text-[var(--color-charcoal)]/40 transition-colors hover:text-[var(--color-burgundy)] disabled:opacity-50"
            >
              <Trash2 size={13} strokeWidth={2} />
              Remove
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
