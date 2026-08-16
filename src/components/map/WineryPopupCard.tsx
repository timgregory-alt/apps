"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { LinkButton } from "@/components/ui/Button";
import { DirectionsButton } from "@/components/winery/DirectionsButton";
import { WineryImage } from "@/components/winery/WineryImage";
import type { WineryWithStatus } from "@/lib/types";

export function WineryPopupCard({
  winery,
  distanceLabel,
  onClose,
}: {
  winery: WineryWithStatus;
  distanceLabel?: string;
  onClose: () => void;
}) {
  const visited = winery.status !== "not_visited";

  return (
    <AnimatePresence>
      <motion.div
        key={winery.id}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 24, opacity: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 340 }}
        className="absolute inset-x-3 bottom-3 z-10 overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-ivory)] shadow-2xl sm:inset-x-auto sm:left-3 sm:w-80"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[var(--color-charcoal)] shadow"
        >
          <X size={15} />
        </button>

        <div className="h-28 w-full">
          <WineryImage name={winery.name} slug={winery.slug} src={winery.hero_image} rows={false} />
        </div>

        <div className="flex flex-col gap-3 p-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-serif-display text-lg leading-tight text-[var(--color-charcoal)]">
                {winery.name}
              </p>
            </div>
            <p className="text-sm text-[var(--color-charcoal)]/60">
              {winery.city}, TN
              {distanceLabel ? ` · ${distanceLabel}` : ""}
            </p>
            <span
              className={
                visited
                  ? "mt-1.5 inline-block rounded-full bg-[var(--color-gold-pale)] px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-[var(--color-burgundy-deep)]"
                  : "mt-1.5 inline-block rounded-full bg-black/5 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-[var(--color-charcoal)]/50"
              }
            >
              {visited ? "Visited" : "Not Visited"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <LinkButton href={`/winery/${winery.slug}`} variant="primary" size="sm" fullWidth>
              View Winery
            </LinkButton>
            <DirectionsButton
              lat={winery.latitude}
              lon={winery.longitude}
              label={winery.name}
              variant="outline"
              size="sm"
              fullWidth
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
