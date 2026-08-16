import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-[var(--color-line)] bg-white/70 backdrop-blur-sm shadow-[0_1px_2px_rgba(36,33,29,0.04),0_12px_32px_-16px_rgba(36,33,29,0.18)]",
        className
      )}
      {...props}
    />
  );
}

export function SectionEyebrow({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-[0.7rem] font-medium uppercase tracking-[0.28em] text-[var(--color-gold)]",
        className
      )}
      {...props}
    />
  );
}
