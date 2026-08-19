import Link from "next/link";
import { Award } from "lucide-react";
import { TrailCoverFrame } from "@/components/ui/TrailCoverFrame";

export function CompletionBanner() {
  return (
    <Link
      href="/completion"
      className="texture-grain relative flex items-center gap-3 overflow-hidden rounded-2xl border border-[var(--color-gold)]/40 bg-[var(--color-burgundy)] px-5 py-4 text-[var(--color-ivory)] shadow-[0_12px_32px_-12px_rgba(94,26,46,0.5)] transition-transform active:scale-[0.99]"
    >
      <TrailCoverFrame />
      <Award size={22} className="relative shrink-0 text-[var(--color-gold-pale)]" strokeWidth={1.5} />
      <div className="relative min-w-0">
        <p className="font-serif-display text-base leading-tight">Trail Complete</p>
        <p className="mt-0.5 text-xs text-[var(--color-ivory)]/75">
          Tap to view your Tennessee Wine Trail Finisher badge
        </p>
      </div>
    </Link>
  );
}
