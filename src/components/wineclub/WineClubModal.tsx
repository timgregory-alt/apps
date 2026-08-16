"use client";

import { Check, Wine } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { WineClubLink } from "@/components/wineclub/WineClubLink";
import type { Winery } from "@/lib/types";

export function WineClubModal({
  winery,
  open,
  onClose,
}: {
  winery: Winery;
  open: boolean;
  onClose: () => void;
}) {
  if (!winery.wine_club_url) return null;

  const benefits = winery.wine_club_benefits?.length
    ? winery.wine_club_benefits
    : ["Exclusive releases", "Member events", "Member pricing", "Bottle discounts"];

  const firstName = winery.name.split(" ")[0];

  return (
    <Sheet open={open} onClose={onClose} labelledBy="wine-club-modal-title">
      <div className="flex flex-col items-center pt-2 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-gold-pale)]">
          <Wine size={22} className="text-[var(--color-burgundy)]" strokeWidth={1.5} />
        </span>
        <h2 id="wine-club-modal-title" className="font-serif-display mt-4 text-2xl text-[var(--color-charcoal)]">
          Enjoying {firstName}?
        </h2>
        <p className="mt-2 max-w-[30ch] text-sm text-[var(--color-charcoal)]/65">
          Take a little of {firstName} home with you.
        </p>

        <p className="font-serif-display mt-5 text-lg text-[var(--color-burgundy)]">
          Join the {winery.wine_club_title ?? `${firstName} Wine Club`}
        </p>

        <ul className="mt-4 flex w-full flex-col gap-2 text-left">
          {benefits.map((b) => (
            <li key={b} className="flex items-center gap-2.5 text-sm text-[var(--color-charcoal)]/75">
              <Check size={15} className="shrink-0 text-[var(--color-gold)]" strokeWidth={2.5} />
              {b}
            </li>
          ))}
        </ul>

        <div className="mt-6 flex w-full flex-col gap-2.5">
          <WineClubLink wineryId={winery.id} wineryName={winery.name} url={winery.wine_club_url} />
          <Button variant="ghost" fullWidth onClick={onClose}>
            Maybe Later
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
