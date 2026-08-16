import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  max,
  className,
  label,
}: {
  value: number;
  max: number;
  className?: string;
  label?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className={cn("w-full", className)}>
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label ?? `${value} of ${max} wineries visited`}
        className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-charcoal)]/10"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--color-gold)] to-[var(--color-gold-soft)] transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
