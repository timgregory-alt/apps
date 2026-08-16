import { Check, Wine } from "lucide-react";
import type { Winery } from "@/lib/types";
import { WineClubLink } from "@/components/wineclub/WineClubLink";

export function WineClubSection({ winery }: { winery: Winery }) {
  if (!winery.wine_club_url) return null;

  const benefits = winery.wine_club_benefits?.length
    ? winery.wine_club_benefits
    : ["Exclusive releases", "Member events", "Member pricing", "Bottle discounts"];

  return (
    <section className="texture-grain relative overflow-hidden rounded-3xl border border-[var(--color-gold)]/30 bg-[var(--color-charcoal)] px-6 py-7 text-[var(--color-ivory)]">
      <Wine size={20} className="text-[var(--color-gold)]" strokeWidth={1.5} />
      <h2 className="font-serif-display mt-3 text-2xl">
        {winery.wine_club_title ?? "Wine Club"}
      </h2>
      <p className="mt-2 text-sm text-[var(--color-ivory)]/70">
        {winery.wine_club_description ?? "Join the club for member-first access."}
      </p>

      <ul className="mt-5 flex flex-col gap-2">
        {benefits.map((b) => (
          <li key={b} className="flex items-center gap-2.5 text-sm text-[var(--color-ivory)]/85">
            <Check size={15} className="shrink-0 text-[var(--color-gold)]" strokeWidth={2.5} />
            {b}
          </li>
        ))}
      </ul>

      <WineClubLink
        wineryId={winery.id}
        wineryName={winery.name}
        url={winery.wine_club_url}
        className="mt-6"
      />
    </section>
  );
}
