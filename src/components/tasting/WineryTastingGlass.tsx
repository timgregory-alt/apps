const CLIP_TOP = 6;
const CLIP_BOTTOM = 30;
const CLIP_HEIGHT = CLIP_BOTTOM - CLIP_TOP;

/** A small wine glass that fills based on how much of a winery's tasting
 * flight the user has tried. Fill % naturally drops when the winery adds
 * new wines — same tried count, bigger denominator. */
export function WineryTastingGlass({
  tried,
  total,
  size = 32,
  layout = "stack",
}: {
  tried: number;
  total: number;
  size?: number;
  /** "stack": icon above label (for spacious rows). "inline": icon beside label (for tight text columns). */
  layout?: "stack" | "inline";
}) {
  if (total === 0) return null;

  const pct = Math.max(0, Math.min(1, tried / total));
  const fillHeight = CLIP_HEIGHT * pct;
  const fillY = CLIP_BOTTOM - fillHeight;
  const clipId = `glass-clip-${tried}-${total}-${size}`;

  const glass = (
    <svg
      width={size}
      height={size * 1.3}
      viewBox="0 0 40 52"
      aria-hidden="true"
      className="shrink-0"
    >
      <defs>
        <clipPath id={clipId}>
          <path d="M 12,6 C 12,17 16,25 20,30 C 24,25 28,17 28,6 Z" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect
          x="12"
          width="16"
          y={fillY}
          height={fillHeight}
          fill="#7c2a41"
          style={{ transition: "y 0.6s ease, height 0.6s ease" }}
        />
      </g>
      <g fill="none" stroke="#b0904f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 12,6 Q 20,9.5 28,6" />
        <path d="M 12,6 C 12,17 16,25 20,30" />
        <path d="M 28,6 C 28,17 24,25 20,30" />
        <path d="M 20,30 L 20,44" />
        <path d="M 14,46 L 26,46" />
      </g>
    </svg>
  );

  if (layout === "inline") {
    return (
      <div
        className="flex shrink-0 items-center gap-1"
        title={`${tried} of ${total} wines tried here`}
      >
        {glass}
        <span className="text-[0.68rem] font-medium tabular-nums text-[var(--color-charcoal)]/50">
          {tried}/{total} tasted
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex shrink-0 flex-col items-center gap-1"
      title={`${tried} of ${total} wines tried here`}
    >
      {glass}
      <span className="text-[0.6rem] font-medium tabular-nums text-[var(--color-charcoal)]/50">
        {tried}/{total}
      </span>
    </div>
  );
}
