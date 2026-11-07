"use client";

import { useRef, useState } from "react";

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Parsed from string parts, not `new Date(...)`, so a plain YYYY-MM-DD date
 * never shifts a day backward in negative-UTC timezones. */
function formatShortDate(isoDate: string): string {
  const [, month, day] = isoDate.split("-").map(Number);
  return `${MONTH_ABBR[month - 1]} ${day}`;
}

/** A small 30-day line, meant to live inside a dark hover tooltip (see
 * StatCard) — not a standalone chart, so it skips axes, gridlines, and a
 * legend. Moving the pointer across it snaps a crosshair to the nearest
 * day and swaps the caption below from "Last 30 days" to that day's value,
 * same job a full chart's tooltip does, just inline instead of floating. */
export function Sparkline({ data, width = 120, height = 28 }: { data: { day: string; value: number }[]; width?: number; height?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (data.length < 2) return null;

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const stepX = width / (data.length - 1);
  const points = data.map((d, i) => {
    const x = i * stepX;
    const y = height - (d.value / maxValue) * (height - 4) - 2;
    return [x, y] as const;
  });
  const path = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

  function handleMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const ratio = (e.clientX - rect.left) / rect.width;
    const index = Math.round(ratio * (data.length - 1));
    setHoverIndex(Math.max(0, Math.min(data.length - 1, index)));
  }

  const hovered = hoverIndex != null ? data[hoverIndex] : null;
  const hoveredPoint = hoverIndex != null ? points[hoverIndex] : null;

  return (
    <div className="mt-1.5 flex flex-col items-center gap-1">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        className="pointer-events-auto overflow-visible"
        onPointerMove={handleMove}
        onPointerLeave={() => setHoverIndex(null)}
      >
        <path
          d={path}
          fill="none"
          stroke="var(--color-gold-pale)"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {hoveredPoint && (
          <>
            <line
              x1={hoveredPoint[0]}
              x2={hoveredPoint[0]}
              y1={0}
              y2={height}
              stroke="var(--color-ivory)"
              strokeOpacity={0.25}
              strokeWidth={1}
            />
            <circle cx={hoveredPoint[0]} cy={hoveredPoint[1]} r={2.25} fill="var(--color-gold-pale)" />
          </>
        )}
      </svg>
      <p className="text-[0.62rem] tabular-nums text-[var(--color-ivory)]/55">
        {hovered ? `${formatShortDate(hovered.day)}: ${hovered.value}` : "Last 30 days"}
      </p>
    </div>
  );
}
