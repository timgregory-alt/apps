/** A decorative gold border frame + watermark emblem, evoking an official
 * passport cover. Pure SVG/CSS — no external image, so it renders reliably
 * and matches the app's ink/gold palette. Purely decorative: absolutely
 * positioned, non-interactive, sits behind the card's real content. */
export function PassportCoverFrame() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {/* Inset double-line border, like an official document */}
      <div className="absolute inset-3 rounded-2xl border border-[var(--color-gold)]/35" />
      <div className="absolute inset-[18px] rounded-xl border border-[var(--color-gold)]/20" />

      {/* Corner flourishes */}
      {[
        "left-4 top-4",
        "right-4 top-4 -scale-x-100",
        "left-4 bottom-4 -scale-y-100",
        "right-4 bottom-4 -scale-x-100 -scale-y-100",
      ].map((pos) => (
        <svg key={pos} viewBox="0 0 24 24" className={`absolute h-4 w-4 text-[var(--color-gold)]/50 ${pos}`}>
          <path
            d="M2 12 C2 6 6 2 12 2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <circle cx="2" cy="12" r="1.4" fill="currentColor" />
          <circle cx="12" cy="2" r="1.4" fill="currentColor" />
        </svg>
      ))}

      {/* Watermark seal */}
      <svg
        viewBox="0 0 200 200"
        className="absolute -bottom-8 -right-8 h-40 w-40 text-[var(--color-gold)]/[0.14]"
      >
        <circle cx="100" cy="100" r="92" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="100" cy="100" r="78" fill="none" stroke="currentColor" strokeWidth="1" />
        <path
          d="M100 40 L108 90 L158 100 L108 110 L100 160 L92 110 L42 100 L92 90 Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}
