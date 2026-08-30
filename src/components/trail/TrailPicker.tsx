import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Trail } from "@/lib/types";

/** Horizontal row of selectable trail cards — active trail highlighted,
 * trails with no wineries mapped yet shown as "Coming soon". Shared between
 * the Explore and My Trails pages so switching trails works the same way
 * in both places. */
export function TrailPicker({
  trails,
  selectedSlug,
  stopCountBySlug,
  basePath,
}: {
  trails: Trail[];
  selectedSlug: string;
  stopCountBySlug: Map<string, number>;
  basePath: string;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {trails.map((t) => {
        const stops = stopCountBySlug.get(t.slug) ?? 0;
        const active = t.slug === selectedSlug;
        return (
          <Link
            key={t.slug}
            href={`${basePath}?trail=${t.slug}`}
            className={cn(
              "flex h-20 w-40 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border px-3 text-center transition-colors",
              active
                ? "border-[var(--color-gold)] bg-[var(--color-burgundy)] text-[var(--color-ivory)]"
                : "border-dashed border-[var(--color-line)] bg-white/40 text-[var(--color-charcoal)]/60"
            )}
          >
            <span className="text-xs font-medium">{t.name}</span>
            <span className={cn("text-[0.65rem]", active ? "text-[var(--color-gold-pale)]" : "text-[var(--color-charcoal)]/45")}>
              {stops > 0 ? `${stops} stops` : "Coming soon"}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
