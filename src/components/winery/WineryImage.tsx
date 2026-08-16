import { cn } from "@/lib/utils";

const PALETTES = [
  { from: "#5e1a2e", to: "#7c2a41" },
  { from: "#3a352e", to: "#24211d" },
  { from: "#7c2a41", to: "#43101f" },
  { from: "#43101f", to: "#24211d" },
];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter((w) => w.length > 0 && !["and", "&", "the", "of"].includes(w.toLowerCase()))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

/**
 * Elegant generative placeholder art for a winery — a monogram over a
 * gradient with fine vineyard-row linework. Fully self-contained (no network
 * image), so it renders reliably until real photography is supplied via
 * `hero_image` / `logo_mark`.
 */
export function WineryImage({
  name,
  slug,
  src,
  className,
  rows = true,
}: {
  name: string;
  slug: string;
  src?: string | null;
  className?: string;
  rows?: boolean;
}) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} className={cn("h-full w-full object-cover", className)} />;
  }

  const palette = PALETTES[hashString(slug) % PALETTES.length];
  const gradientId = `wg-${slug}`;

  return (
    <div
      role="img"
      aria-label={name}
      className={cn("relative h-full w-full overflow-hidden", className)}
      style={{
        background: `linear-gradient(135deg, ${palette.from}, ${palette.to})`,
      }}
    >
      <svg
        className="absolute inset-0 h-full w-full opacity-25"
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMax slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8dcb8" stopOpacity="0" />
            <stop offset="100%" stopColor="#e8dcb8" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        {rows &&
          Array.from({ length: 7 }).map((_, i) => (
            <path
              key={i}
              d={`M ${-40 + i * 60} 300 L ${120 + i * 60} 60`}
              stroke={`url(#${gradientId})`}
              strokeWidth="2"
              fill="none"
            />
          ))}
      </svg>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(232,220,184,0.16),transparent_60%)]" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-serif-display text-4xl tracking-[0.08em] text-[var(--color-gold-pale)]/90 drop-shadow-sm">
          {initials(name)}
        </span>
      </div>
      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10" />
    </div>
  );
}
