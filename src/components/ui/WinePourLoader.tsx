/** An ambient, looping wine-pour animation used as the app's loading state.
 * Pure CSS/SVG (no video asset) — see the wine-pour-* keyframes in globals.css. */
export function WinePourLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6"
    >
      <svg width="140" height="182" viewBox="0 0 200 260" aria-hidden="true">
        <defs>
          <clipPath id="glass-bowl-clip">
            <path d="M 58,62 C 58,92 74,118 100,132 C 126,118 142,92 142,62 Z" />
          </clipPath>
          <linearGradient id="wine-liquid-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c2a41" />
            <stop offset="100%" stopColor="#43101f" />
          </linearGradient>
        </defs>

        {/* Pour stream */}
        <rect
          className="wine-pour-stream"
          x="97"
          y="18"
          width="4"
          height="40"
          rx="2"
          fill="#7c2a41"
        />
        <circle className="wine-pour-droplet" cx="99" cy="56" r="3" fill="#7c2a41" />

        {/* Glass outline */}
        <g
          fill="none"
          stroke="#b0904f"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M 55,60 Q 100,68 145,60" />
          <path d="M 55,60 C 55,92 72,120 100,134" />
          <path d="M 145,60 C 145,92 128,120 100,134" />
          <path d="M 100,134 L 100,190" />
          <path d="M 78,193 L 122,193" />
        </g>

        {/* Liquid fill, clipped to the bowl interior */}
        <g clipPath="url(#glass-bowl-clip)">
          <rect
            className="wine-pour-fill"
            x="56"
            width="88"
            y="132"
            height="0"
            fill="url(#wine-liquid-gradient)"
          />
          <ellipse
            className="wine-pour-wave"
            cx="100"
            cy="132"
            rx="30"
            ry="3"
            fill="#e8dcb8"
            opacity="0"
          />
        </g>
      </svg>

      <p className="font-serif-display text-sm italic tracking-wide text-[var(--color-charcoal)]/50">
        {label}…
      </p>
    </div>
  );
}
