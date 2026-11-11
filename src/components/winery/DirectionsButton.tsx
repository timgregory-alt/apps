"use client";

import { useRouter } from "next/navigation";
import { Navigation } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { openDirections } from "@/lib/directions";
import { logGatedActionAttemptAction } from "@/app/actions/analytics";

export function DirectionsButton({
  lat,
  lon,
  label,
  variant = "outline",
  size = "md",
  fullWidth,
  isLoggedIn = true,
  wineryId,
  redirectTo,
}: {
  lat: number;
  lon: number;
  label: string;
  variant?: "outline" | "primary" | "gold" | "ghost" | "ivory";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  /** When false, tapping the button logs a gated attempt and sends the
   * guest to sign in instead of opening directions. Defaults to true
   * (always allowed) for any caller that doesn't pass this. */
  isLoggedIn?: boolean;
  /** Required whenever isLoggedIn is false, to log and redirect correctly. */
  wineryId?: string;
  redirectTo?: string;
}) {
  const router = useRouter();

  function handleClick() {
    if (!isLoggedIn && wineryId && redirectTo) {
      void logGatedActionAttemptAction("get_directions", wineryId);
      router.push(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
      return;
    }
    openDirections(lat, lon, label);
  }

  return (
    <Button type="button" variant={variant} size={size} fullWidth={fullWidth} onClick={handleClick}>
      <Navigation size={16} strokeWidth={2} />
      Get Directions
    </Button>
  );
}
