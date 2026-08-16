import Link from "next/link";
import { cn } from "@/lib/utils";

export function Header({
  title,
  eyebrow,
  className,
  back,
}: {
  title?: string;
  eyebrow?: string;
  className?: string;
  back?: string;
}) {
  return (
    <header className={cn("mx-auto w-full max-w-md px-6 pt-[calc(env(safe-area-inset-top)+1.25rem)]", className)}>
      {back && (
        <Link
          href={back}
          className="mb-3 inline-flex items-center gap-1 text-sm text-[var(--color-charcoal)]/60 hover:text-[var(--color-burgundy)]"
        >
          ← Back
        </Link>
      )}
      {eyebrow && (
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.28em] text-[var(--color-gold)]">
          {eyebrow}
        </p>
      )}
      {title && (
        <h1 className="font-serif-display mt-1 text-3xl leading-tight text-[var(--color-charcoal)]">
          {title}
        </h1>
      )}
    </header>
  );
}
