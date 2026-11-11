"use client";

import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { buttonVariants } from "@/components/ui/Button";
import { logGatedActionAttemptAction } from "@/app/actions/analytics";
import { cn } from "@/lib/utils";

export function WineClubLink({
  wineryId,
  wineryName,
  url,
  className,
  label = "Explore Wine Club",
  isLoggedIn = true,
  redirectTo,
}: {
  wineryId: string;
  wineryName: string;
  url: string;
  className?: string;
  label?: string;
  /** When false, tapping logs a gated attempt and sends the guest to sign
   * in instead of opening the wine club link. Defaults to true (always
   * allowed) for callers that don't pass this. */
  isLoggedIn?: boolean;
  /** Required whenever isLoggedIn is false. */
  redirectTo?: string;
}) {
  const router = useRouter();

  function handleClick(e: React.MouseEvent) {
    if (!isLoggedIn && redirectTo) {
      e.preventDefault();
      void logGatedActionAttemptAction("explore_wine_club", wineryId);
      router.push(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
      return;
    }
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
