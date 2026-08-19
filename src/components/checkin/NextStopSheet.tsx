"use client";

import { Sheet } from "@/components/ui/Sheet";
import { Button, LinkButton } from "@/components/ui/Button";
import { WineryImage } from "@/components/winery/WineryImage";
import { DirectionsButton } from "@/components/winery/DirectionsButton";
import { formatDistance } from "@/lib/geo";
import type { WineryWithStatus } from "@/lib/types";

export function NextStopSheet({
  open,
  onClose,
  next,
  etaMinutes,
}: {
  open: boolean;
  onClose: () => void;
  next: { winery: WineryWithStatus; distanceMiles: number } | null;
  etaMinutes: number;
}) {
  return (
    <Sheet open={open} onClose={onClose} labelledBy="next-stop-title">
      <p className="text-center text-[0.7rem] font-medium uppercase tracking-[0.28em] text-[var(--color-gold)]">
        Where to next?
      </p>

      {next ? (
        <>
          <div className="mt-4 overflow-hidden rounded-2xl">
            <div className="h-36 w-full">
              <WineryImage
                name={next.winery.name}
                slug={next.winery.slug}
                src={next.winery.hero_image}
              />
            </div>
          </div>
          <h2 id="next-stop-title" className="font-serif-display mt-4 text-center text-2xl text-[var(--color-charcoal)]">
            {next.winery.name}
          </h2>
          {etaMinutes > 0 && (
            <p className="mt-1 text-center text-sm text-[var(--color-charcoal)]/60">
              Approximately {etaMinutes} minutes away
              {next.distanceMiles > 0 ? ` · ${formatDistance(next.distanceMiles)}` : ""}
            </p>
          )}

          <div className="mt-6 flex flex-col gap-2.5">
            <DirectionsButton
              lat={next.winery.latitude}
              lon={next.winery.longitude}
              label={next.winery.name}
              variant="primary"
              fullWidth
            />
            <LinkButton href={`/winery/${next.winery.slug}`} variant="outline" fullWidth>
              View Winery
            </LinkButton>
            <Button variant="ghost" fullWidth onClick={onClose}>
              Not Now
            </Button>
          </div>
        </>
      ) : (
        <div className="mt-4 flex flex-col items-center gap-4 text-center">
          <p id="next-stop-title" className="font-serif-display text-2xl text-[var(--color-burgundy)]">
            You&rsquo;ve visited every stop!
          </p>
          <p className="text-sm text-[var(--color-charcoal)]/65">
            Head to My Trail to see your completion badge.
          </p>
          <LinkButton href="/completion" variant="primary" fullWidth>
            View Completion
          </LinkButton>
        </div>
      )}
    </Sheet>
  );
}
