import { Check, Wine } from "lucide-react";

/** A single ink-stamp token for the winery hero photo — same ring/size on
 * both faces, revealed by literally flipping over once visited (same 3D
 * flip technique as the wine tasting cards), rather than two different
 * designs swapped in place. */
export function WineryVisitedStamp({ visited }: { visited: boolean }) {
  return (
    <div className="h-[72px] w-[72px] rotate-[-9deg] [perspective:700px]">
      <div
        className="relative h-full w-full transition-transform duration-700 ease-out [transform-style:preserve-3d]"
        style={{ transform: `rotateY(${visited ? 180 : 0}deg)` }}
      >
        {/* Front — not yet visited */}
        <div className="absolute inset-0 flex items-center justify-center rounded-full [backface-visibility:hidden]">
          <div
            className="absolute inset-0 rounded-full blur-[5px]"
            style={{ background: "rgba(250,246,238,0.2)" }}
          />
          <svg viewBox="0 0 100 100" className="absolute h-full w-full">
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="#faf6ee"
              strokeWidth="1.5"
              strokeDasharray="3 5"
              opacity="0.7"
            />
            <circle cx="50" cy="50" r="37" fill="none" stroke="#faf6ee" strokeWidth="1" opacity="0.45" />
          </svg>
          <Wine size={22} strokeWidth={1.5} className="relative text-[var(--color-ivory)]/55" />
        </div>

        {/* Back — visited (pre-mirrored so it reads correctly once flipped) */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 rounded-full [backface-visibility:hidden]"
          style={{ transform: "rotateY(180deg)" }}
        >
          <div
            className="absolute inset-0 rounded-full blur-[5px]"
            style={{ background: "rgba(250,246,238,0.4)" }}
          />
          <svg viewBox="0 0 100 100" className="absolute h-full w-full">
            <circle cx="50" cy="50" r="46" fill="none" stroke="#7c2a41" strokeWidth="2.5" opacity="0.9" />
            <circle cx="50" cy="50" r="37" fill="none" stroke="#7c2a41" strokeWidth="1.4" opacity="0.55" />
          </svg>
          <Check size={20} strokeWidth={3} className="relative text-[#7c2a41]" />
          <span className="relative text-[0.5rem] font-bold uppercase tracking-[0.14em] text-[#7c2a41]">
            Visited
          </span>
        </div>
      </div>
    </div>
  );
}
