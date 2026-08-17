"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Share2, ArrowRight } from "lucide-react";
import { createPortal } from "react-dom";
import { PassportStamp } from "@/components/passport/PassportStamp";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { formatCheckinDate } from "@/lib/utils";

export function CelebrationOverlay({
  wineryName,
  city,
  checkinDateISO,
  visited,
  total,
  onShare,
  onNext,
}: {
  wineryName: string;
  city: string;
  checkinDateISO: string;
  visited: number;
  total: number;
  onShare: () => void;
  onNext: () => void;
}) {
  const [stage, setStage] = useState<"welcome" | "stamp" | "celebrate">("welcome");

  useEffect(() => {
    const t1 = setTimeout(() => setStage("stamp"), 900);
    const t2 = setTimeout(() => setStage("celebrate"), 2200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <motion.div
      className="texture-grain fixed inset-0 z-[60] flex flex-col items-center justify-center bg-[var(--color-charcoal)] px-8 text-center text-[var(--color-ivory)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      role="status"
      aria-live="polite"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(176,144,79,0.14),transparent_55%)]" />

      {stage !== "welcome" && (
        <div
          className="animate-impact-flash pointer-events-none absolute inset-0 bg-[var(--color-gold-pale)]"
          aria-hidden="true"
        />
      )}

      <AnimatePresence mode="wait">
        {stage === "welcome" && (
          <motion.p
            key="welcome"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="font-serif-display relative text-2xl italic text-[var(--color-gold-pale)]"
          >
            Welcome to {wineryName}
          </motion.p>
        )}

        {stage !== "welcome" && (
          <motion.div
            key="stamp"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="animate-impact-shake relative flex flex-col items-center"
          >
            <PassportStamp
              name={wineryName}
              city={city}
              status="visited"
              size="lg"
              justStamped={stage === "stamp"}
            />
            <p className="font-serif-display mt-6 text-2xl uppercase tracking-wide text-white">
              {wineryName}
            </p>
            <p className="mt-1 text-sm uppercase tracking-[0.2em] text-[var(--color-gold)]">
              Visited — {formatCheckinDate(checkinDateISO).toUpperCase()}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {stage === "celebrate" && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="relative mt-10 flex w-full max-w-xs flex-col items-center gap-5"
          >
            <p className="text-[1.05rem] text-[var(--color-ivory)]/90">
              Another Tennessee Wine Passport stamp collected.
            </p>

            <div className="w-full">
              <p className="mb-2 text-sm text-[var(--color-ivory)]/70">
                {visited} of {total} wineries visited
              </p>
              <ProgressBar value={visited} max={total} />
            </div>

            <div className="mt-2 flex w-full flex-col gap-2.5">
              <Button variant="gold" fullWidth onClick={onShare}>
                <Share2 size={16} strokeWidth={2} />
                Share Your Visit
              </Button>
              <Button variant="ivory" fullWidth onClick={onNext}>
                Choose Your Next Stop
                <ArrowRight size={16} strokeWidth={2} />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>,
    document.body
  );
}
