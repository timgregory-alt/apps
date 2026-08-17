"use client";

import { useState } from "react";
import { Check, ChevronDown, Share2, Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { POINTS_PER_REFERRAL } from "@/lib/rewards";
import { cn } from "@/lib/utils";

export function ReferralCard({ userId, referralCount }: { userId: string; referralCount: number }) {
  // Arriving via a #referral link (e.g. from the Rewards page) opens the
  // card automatically instead of landing on a collapsed row.
  const [open, setOpen] = useState(
    () => typeof window !== "undefined" && window.location.hash === "#referral"
  );
  const [copied, setCopied] = useState(false);
  const link =
    typeof window !== "undefined" ? `${window.location.origin}/signup?ref=${userId}` : "";

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Tennessee Wine Passport", url: link });
        return;
      } catch {
        // user cancelled — fall through to copy
      }
    }
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card id="referral" className={cn("flex flex-col p-5", open && "gap-3")}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between gap-2"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-charcoal)]/45">
          <Users size={14} className="text-[var(--color-charcoal)]/40" />
          Refer a Friend
        </span>
        <ChevronDown
          size={15}
          strokeWidth={2.5}
          className={cn(
            "shrink-0 text-[var(--color-charcoal)]/45 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-[var(--color-charcoal)]/70">
            Share your link — once a friend signs up and checks in at a winery, you earn{" "}
            {POINTS_PER_REFERRAL} bonus points.
          </p>

          <div className="flex items-center justify-between gap-4 rounded-xl bg-[var(--color-gold-pale)]/30 px-4 py-3">
            <div>
              <p className="font-serif-display text-2xl text-[var(--color-burgundy)]">
                {referralCount}
              </p>
              <p className="text-xs text-[var(--color-charcoal)]/55">
                {referralCount === 1 ? "friend referred" : "friends referred"}
              </p>
            </div>
            <div className="text-right">
              <p className="font-serif-display text-2xl text-[var(--color-burgundy)]">
                {referralCount * POINTS_PER_REFERRAL}
              </p>
              <p className="text-xs text-[var(--color-charcoal)]/55">bonus points earned</p>
            </div>
          </div>

          <Button type="button" size="sm" variant="outline" onClick={handleShare}>
            {copied ? <Check size={16} strokeWidth={2} /> : <Share2 size={16} strokeWidth={2} />}
            {copied ? "Link Copied" : "Share Your Link"}
          </Button>
        </div>
      )}
    </Card>
  );
}
