export function CompletionBadge() {
  return (
    <div className="relative mx-auto flex h-48 w-48 items-center justify-center">
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full text-[var(--color-gold)]">
        <defs>
          <path id="badge-arc" d="M 26,110 A 74,74 0 1 1 174,110" fill="none" />
        </defs>
        <circle cx="100" cy="100" r="96" fill="var(--color-burgundy)" opacity="0.06" />
        <circle cx="100" cy="100" r="88" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="100" cy="100" r="78" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
        <text fill="currentColor" fontSize="8.5" letterSpacing="1" fontWeight={600}>
          <textPath href="#badge-arc" startOffset="50%" textAnchor="middle">
            TN WINE TRAIL FINISHER
          </textPath>
        </text>
      </svg>
      <div className="flex flex-col items-center text-[var(--color-burgundy)]">
        <span className="font-serif-display text-5xl leading-none">4/4</span>
        <span className="mt-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[var(--color-gold)]">
          Complete
        </span>
      </div>
    </div>
  );
}
