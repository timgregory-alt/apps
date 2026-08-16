"use client";

import { Navigation } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { openDirections } from "@/lib/directions";

export function DirectionsButton({
  lat,
  lon,
  label,
  variant = "outline",
  size = "md",
  fullWidth,
}: {
  lat: number;
  lon: number;
  label: string;
  variant?: "outline" | "primary" | "gold" | "ghost" | "ivory";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      onClick={() => openDirections(lat, lon, label)}
    >
      <Navigation size={16} strokeWidth={2} />
      Get Directions
    </Button>
  );
}
