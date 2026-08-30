"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Wine } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useGeolocation } from "@/hooks/useGeolocation";
import { CelebrationOverlay } from "@/components/checkin/CelebrationOverlay";
import { NextStopSheet } from "@/components/checkin/NextStopSheet";
import { ShareSheet } from "@/components/share/ShareSheet";
import { WineClubModal } from "@/components/wineclub/WineClubModal";
import { recommendNextStop } from "@/lib/trail";
import { formatCheckinDate } from "@/lib/utils";
import { notifyPointsChanged } from "@/lib/pointsEvents";
import type { Winery, WineryWithStatus } from "@/lib/types";

type Stage = "idle" | "celebrating" | "wineclub" | "nextstop" | "sharing";

export function CheckInFlow({
  winery,
  allWineries,
  isLoggedIn,
}: {
  winery: WineryWithStatus;
  allWineries: WineryWithStatus[];
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const { status, locate } = useGeolocation();
  const [stage, setStage] = useState<Stage>("idle");
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkinDate, setCheckinDate] = useState<string>(winery.checkin?.checkin_date ?? "");
  const [trailComplete, setTrailComplete] = useState(false);
  const [alreadyVisited, setAlreadyVisited] = useState(winery.status !== "not_visited");

  const updatedWineries = useMemo<WineryWithStatus[]>(
    () =>
      allWineries.map((w) =>
        w.id === winery.id && alreadyVisited ? { ...w, status: "visited" as const } : w
      ),
    [allWineries, winery.id, alreadyVisited]
  );
  const visited = updatedWineries.filter((w) => w.status !== "not_visited").length;
  const nextStop = recommendNextStop(updatedWineries);

  async function handleCheckIn() {
    if (!isLoggedIn) {
      router.push(`/login?redirectTo=/winery/${winery.slug}`);
      return;
    }
    setBlockedMessage(null);
    setSubmitting(true);
    try {
      const coords = await locate();
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wineryId: winery.id,
          latitude: coords.latitude,
          longitude: coords.longitude,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.verified) {
        setBlockedMessage(
          data.message ??
            "It looks like you're not quite at the winery yet. Visit the tasting room to collect your trail stamp."
        );
        return;
      }

      setCheckinDate(data.checkin?.checkin_date ?? new Date().toISOString());
      setAlreadyVisited(true);
      setTrailComplete(Boolean(data.trailComplete));
      setStage("celebrating");
      notifyPointsChanged();
      // The winery page's other server-rendered sections (like wine tasting,
      // which is locked until checked in) were computed before this
      // check-in landed — refresh so they pick it up without the guest
      // needing to reload the page themselves.
      router.refresh();
    } catch {
      setBlockedMessage(
        "We couldn't verify your location. Please enable location services and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleCelebrationNext() {
    if (winery.wine_club_url) {
      setStage("wineclub");
    } else {
      advanceToNextStop();
    }
  }

  function advanceToNextStop() {
    if (trailComplete) {
      router.push("/completion");
      return;
    }
    setStage("nextstop");
  }

  if (alreadyVisited && stage === "idle") {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-[var(--color-gold)]/40 bg-[var(--color-gold-pale)]/40 px-5 py-4 text-center">
          <Wine size={18} className="text-[var(--color-burgundy)]" strokeWidth={1.75} />
          <p className="font-serif-display text-lg text-[var(--color-burgundy)]">
            Visited{checkinDate ? ` — ${formatCheckinDate(checkinDate).toUpperCase()}` : ""}
          </p>
          <p className="text-xs text-[var(--color-charcoal)]/60">
            Your trail stamp for {winery.name} has been collected.
          </p>
        </div>

        <Button
          variant="outline"
          size="lg"
          fullWidth
          onClick={handleCheckIn}
          disabled={submitting}
          aria-busy={submitting}
        >
          <MapPin size={18} strokeWidth={2} />
          {submitting
            ? status === "locating"
              ? "Finding you…"
              : "Checking in…"
            : "Check In Again"}
        </Button>

        {blockedMessage && (
          <p role="alert" className="text-center text-sm text-[var(--color-burgundy)]">
            {blockedMessage}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Button
        variant="primary"
        size="lg"
        fullWidth
        onClick={handleCheckIn}
        disabled={submitting}
        aria-busy={submitting}
      >
        <MapPin size={18} strokeWidth={2} />
        {submitting
          ? status === "locating"
            ? "Finding you…"
            : "Checking in…"
          : "Check In & Collect Your Stamp"}
      </Button>

      {blockedMessage && (
        <p role="alert" className="text-center text-sm text-[var(--color-burgundy)]">
          {blockedMessage}
        </p>
      )}

      {stage === "celebrating" && (
        <CelebrationOverlay
          wineryName={winery.name}
          city={winery.city}
          checkinDateISO={checkinDate}
          visited={visited}
          total={updatedWineries.length}
          onShare={() => setStage("sharing")}
          onNext={handleCelebrationNext}
        />
      )}

      <ShareSheet
        open={stage === "sharing"}
        onClose={() => setStage("celebrating")}
        wineryId={winery.id}
        headline={`✓ ${winery.name.toUpperCase()}`}
        subheadline={`${visited} OF ${updatedWineries.length} WINERIES VISITED`}
        tagline="Where should I go next?"
        visited={visited}
        total={updatedWineries.length}
        shareUrl={`https://tennesseewinetrails.com/winery/${winery.slug}`}
      />

      {stage === "wineclub" && (
        <WineClubModal
          winery={winery as Winery}
          open={stage === "wineclub"}
          onClose={advanceToNextStop}
        />
      )}

      <NextStopSheet
        open={stage === "nextstop"}
        onClose={() => setStage("idle")}
        next={nextStop}
        etaMinutes={nextStop ? Math.round(nextStop.etaMinutes) : 0}
      />
    </div>
  );
}
