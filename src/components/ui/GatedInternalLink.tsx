"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { logGatedActionAttemptAction } from "@/app/actions/analytics";

/** An internal link to a page that itself requires an account (My Trails,
 * Profile) — visible to everyone, but a signed-out click skips the detour
 * through that other page's own wall and logs the attempt + redirects
 * straight to /login instead. */
export function GatedInternalLink({
  href,
  isLoggedIn,
  action,
  redirectTo,
  className,
  children,
}: {
  href: string;
  isLoggedIn: boolean;
  action: string;
  redirectTo: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  function handleClick(e: React.MouseEvent) {
    if (isLoggedIn) return;
    e.preventDefault();
    void logGatedActionAttemptAction(action, null);
    router.push(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  return (
    <Link href={href} onClick={handleClick} className={className}>
      {children}
    </Link>
  );
}
