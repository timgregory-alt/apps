import { CheckCircle2 } from "lucide-react";
import { QrCode } from "@/components/ui/QrCode";
import type { RewardRedemption } from "@/lib/types";

/** The QR code + manual fallback code shown once a reward has been revealed. */
export function RedemptionCodeDisplay({ redemption }: { redemption: RewardRedemption }) {
  return (
    <div className="flex flex-col items-center gap-3">
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
  );
}
