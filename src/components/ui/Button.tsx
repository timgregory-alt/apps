import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-sans font-medium tracking-wide transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-gold)] focus-visible:ring-offset-[var(--color-ivory)] disabled:opacity-50 disabled:pointer-events-none select-none";

const variants = {
  primary:
    "bg-[var(--color-burgundy)] text-[var(--color-ivory)] hover:bg-[var(--color-burgundy-deep)] shadow-[0_8px_24px_-8px_rgba(94,26,46,0.55)] active:scale-[0.98]",
  gold: "bg-[var(--color-gold)] text-[var(--color-charcoal)] hover:bg-[var(--color-gold-soft)] shadow-[0_8px_24px_-8px_rgba(176,144,79,0.5)] active:scale-[0.98]",
  outline:
    "border border-[var(--color-charcoal)]/25 text-[var(--color-charcoal)] hover:border-[var(--color-gold)] hover:text-[var(--color-burgundy)] bg-transparent active:scale-[0.98]",
  ghost:
    "text-[var(--color-charcoal)]/80 hover:text-[var(--color-burgundy)] hover:bg-black/[0.03] active:scale-[0.98]",
  ivory:
    "bg-[var(--color-ivory)] text-[var(--color-charcoal)] hover:bg-white shadow-[0_8px_24px_-8px_rgba(0,0,0,0.25)] active:scale-[0.98]",
} as const;

const sizes = {
  sm: "h-9 px-4 text-sm min-w-9",
  md: "h-12 px-6 text-[0.95rem] min-w-12",
  lg: "h-14 px-8 text-base min-w-14",
} as const;

interface CommonProps {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  fullWidth?: boolean;
}

/** Returns the Button's visual classes for use on non-button elements (e.g. an <a>). */
export function buttonVariants({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
}: CommonProps & { className?: string } = {}) {
  return cn(base, variants[variant], sizes[size], fullWidth && "w-full", className);
}

type ButtonProps = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type LinkButtonProps = CommonProps & {
  href: string;
  children?: React.ReactNode;
  className?: string;
  target?: string;
  rel?: string;
  "aria-label"?: string;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", fullWidth, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], fullWidth && "w-full", className)}
      {...props}
    />
  );
});

export function LinkButton({
  href,
  className,
  variant = "primary",
  size = "md",
  fullWidth,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={cn(base, variants[variant], sizes[size], fullWidth && "w-full", className)}
      {...props}
    />
  );
}
