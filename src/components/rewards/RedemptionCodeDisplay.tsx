"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, EyeOff } from "lucide-react";
import { QrCode } from "@/components/ui/QrCode";
import type { RewardRedemption } from "@/lib/types";

const VISIBLE_MS = 2 * 60 * 1000;

/** The QR code + manual fallback code shown once a reward has been revealed.
 * Flips face-down 2 minutes after it was redeemed — showing the code IS the
 * redemption, so there's no reason to leave it sitting on screen indefinitely
 * once it's been shown at the register. */
export function RedemptionCodeDisplay({ redemption }: { redemption: RewardRedemption }) {
  const revealedAt = new Date(redemption.redeemed_at ?? redemption.issued_at).getTime();
  const [hidden, setHidden] = useState(() => Date.now() - revealedAt >= VISIBLE_MS);

  useEffect(() => {
    if (hidden) return;
    const remaining = VISIBLE_MS - (Date.now() - revealedAt);
    const timer = setTimeout(() => setHidden(true), Math.max(remaining, 0));
    return () => clearTimeout(timer);
  }, [hidden, revealedAt]);

  return (
    <div className="w-full [perspective:1200px]">
      <motion.div
        className="relative mx-auto flex min-h-[19rem] w-full max-w-[220px] [transform-style:preserve-3d]"
        animate={{ rotateY: hidden ? 180 : 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="absolute inset-0 flex flex-col items-center gap-3 [backface-visibility:hidden]">
          <div
            className={
              redemption.status === "redeemed"
                ? "inline-flex items-center gap-1.5 rounded-full bg-black/5 px-3 py-1 text-xs font-medium text-[var(--color-charcoal)]/60"
                : "inline-flex items-center gap-1.5 rounded-full bg-[var(--color-gold)]/15 px-3 py-1 text-xs font-medium text-[var(--color-gold)]"
            }
          >
            {redemption.status === "redeemed" ? (
              <>
                <CheckCircle2 size={13} /> Redeemed
              </>
            ) : (
              "Ready to redeem"
            )}
          </div>
          <QrCode
            value={`${typeof window !== "undefined" ? window.location.origin : ""}/redeem/${redemption.code}`}
            size={160}
          />
          <p className="font-mono text-lg tracking-[0.3em] text-[var(--color-charcoal)]">{redemption.code}</p>
          <p className="text-center text-xs text-[var(--color-charcoal)]/55">
            Show this QR code to winery staff, or give them the code above if they can&apos;t scan it.
          </p>
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl bg-black/[0.03] px-4 text-center [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/5">
            <EyeOff size={17} className="text-[var(--color-charcoal)]/45" strokeWidth={1.75} />
          </span>
          <p className="text-sm font-medium text-[var(--color-charcoal)]/60">Code hidden</p>
          <p className="max-w-[22ch] text-xs text-[var(--color-charcoal)]/45">
            It&rsquo;s already been shown once — this reward has been redeemed.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
