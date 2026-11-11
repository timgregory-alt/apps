"use client";

import { useRouter } from "next/navigation";
import { logGatedActionAttemptAction } from "@/app/actions/analytics";

/** An outbound link (Instagram, website, wine club, etc.) that's visible to
 * everyone — so a signed-out guest can see it's there — but only actually
 * navigates for a signed-in guest. A signed-out click logs the attempt and
 * redirects to /login instead, same pattern as check-in/rating/flip. */
export function GatedExternalLink({
  href,
  isLoggedIn,
  action,
  wineryId,
  redirectTo,
  className,
  ariaLabel,
  children,
}: {
  href: string;
  isLoggedIn: boolean;
  action: string;
  wineryId: string;
  redirectTo: string;
  className?: string;
  ariaLabel?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  function handleClick(e: React.MouseEvent) {
    if (isLoggedIn) return;
    e.preventDefault();
    void logGatedActionAttemptAction(action, wineryId);
    router.push(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      aria-label={ariaLabel}
      className={className}
    >
      {children}
    </a>
  );
}
