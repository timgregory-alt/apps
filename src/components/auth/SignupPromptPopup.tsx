"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CenteredDialog } from "@/components/ui/CenteredDialog";

const DISMISSED_KEY = "signup_prompt_seen";
const DELAY_MS = 30_000;

/** A dismissible nudge to sign up, shown once a signed-out visitor has been
 * on the homepage for a while — unlike the old AuthModal wall, this never
 * blocks browsing: it can be closed, and once shown it's remembered in
 * localStorage so it never reappears on that browser again. */
export function SignupPromptPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alreadySeen = false;
    try {
      alreadySeen = localStorage.getItem(DISMISSED_KEY) === "1";
    } catch {
      // Private browsing / blocked storage — fine, it just won't be
      // remembered across visits, so it may show again next time.
    }
    if (alreadySeen) return;

    const timer = setTimeout(() => {
      setOpen(true);
      try {
        localStorage.setItem(DISMISSED_KEY, "1");
      } catch {
        // Nothing to persist — not worth blocking the popup over.
      }
    }, DELAY_MS);

    return () => clearTimeout(timer);
  }, []);

  return (
    <CenteredDialog open={open} onClose={() => setOpen(false)} labelledBy="signup-prompt-title">
      <div className="flex flex-col items-center text-center">
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.28em] text-[var(--color-gold)]">
          Tennessee Wine Trails
        </p>
        <h2 id="signup-prompt-title" className="font-serif-display mt-1 text-2xl text-[var(--color-charcoal)]">
          Enjoying the Trail?
        </h2>
        <p className="mt-2 text-sm text-[var(--color-charcoal)]/60">
          Create a free account to check in at wineries, rate wines, and start earning real rewards.
        </p>

        <div className="mt-6 flex w-full flex-col gap-2.5">
          <Link
            href="/signup"
            className="flex h-11 w-full items-center justify-center rounded-full bg-[var(--color-burgundy)] text-sm font-medium text-white"
          >
            Create Free Account
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-sm text-[var(--color-charcoal)]/55 hover:text-[var(--color-burgundy)]"
          >
            Maybe later
          </button>
        </div>
      </div>
    </CenteredDialog>
  );
}
