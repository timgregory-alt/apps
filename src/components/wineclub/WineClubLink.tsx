"use client";

import { ExternalLink } from "lucide-react";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function WineClubLink({
  wineryId,
  wineryName,
  url,
  className,
  label = "Explore Wine Club",
}: {
  wineryId: string;
  wineryName: string;
  url: string;
  className?: string;
  label?: string;
}) {
  function handleClick() {
    fetch("/api/wine-club-click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wineryId }),
      keepalive: true,
    }).catch(() => {});
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      aria-label={`${label} — ${wineryName}`}
      className={cn(buttonVariants({ variant: "gold", fullWidth: true }), className)}
    >
      {label}
      <ExternalLink size={16} strokeWidth={2} />
    </a>
  );
}
