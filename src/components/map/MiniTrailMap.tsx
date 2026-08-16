import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { WineryWithStatus } from "@/lib/types";

// Normalizes the trail's lat/lon spread into 0–1 for a lightweight,
// dependency-free preview. The full interactive Mapbox experience lives at /map.
function project(wineries: WineryWithStatus[]) {
  const lats = wineries.map((w) => w.latitude);
  const lons = wineries.map((w) => w.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const padLat = (maxLat - minLat || 1) * 0.25;
  const padLon = (maxLon - minLon || 1) * 0.25;

  return wineries.map((w) => {
    const x = ((w.longitude - (minLon - padLon)) / (maxLon - minLon + padLon * 2 || 1)) * 100;
    const y =
      (1 - (w.latitude - (minLat - padLat)) / (maxLat - minLat + padLat * 2 || 1)) * 100;
    return { winery: w, x, y };
  });
}

export function MiniTrailMap({ wineries }: { wineries: WineryWithStatus[] }) {
  const points = project(wineries);

  return (
    <Link
      href="/map"
      aria-label="Open the interactive wine trail map"
      className="group relative block aspect-[16/11] w-full overflow-hidden rounded-3xl border border-[var(--color-line)] bg-[var(--color-parchment)]"
    >
      <div className="texture-grain absolute inset-0" />
      <svg className="absolute inset-0 h-full w-full opacity-40" aria-hidden="true">
        <defs>
          <pattern id="mini-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#24211d" strokeOpacity="0.06" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#mini-grid)" />
      </svg>

      {points.length > 1 && (
        <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
          <polyline
            points={points.map((p) => `${p.x}%,${p.y}%`).join(" ")}
            fill="none"
            stroke="var(--color-gold)"
            strokeWidth={1.5}
            strokeDasharray="1 7"
            strokeLinecap="round"
            opacity={0.7}
          />
        </svg>
      )}

      {points.map(({ winery, x, y }) => (
        <span
          key={winery.id}
          className="absolute -translate-x-1/2 -translate-y-full"
          style={{ left: `${x}%`, top: `${y}%` }}
        >
          <span
            className={
              winery.status !== "not_visited"
                ? "block h-3 w-3 rounded-full border-2 border-white bg-[var(--color-gold)] shadow-md"
                : "block h-2.5 w-2.5 rounded-full border-2 border-white bg-[var(--color-burgundy)] shadow-md"
            }
          />
        </span>
      ))}

      <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/85 px-3 py-1.5 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-[var(--color-charcoal)] shadow-sm transition-transform group-hover:translate-x-0.5">
        View trail map
        <ArrowUpRight size={13} strokeWidth={2.25} />
      </div>
    </Link>
  );
}
