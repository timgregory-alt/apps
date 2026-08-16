import Link from "next/link";

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-[calc(100dvh-6rem)] max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-8 text-center">
        <Link
          href="/"
          className="text-[0.7rem] font-medium uppercase tracking-[0.28em] text-[var(--color-gold)]"
        >
          Tennessee Wine Passport
        </Link>
        <p className="mt-3 font-serif-display text-xs uppercase tracking-[0.2em] text-[var(--color-charcoal)]/40">
          {eyebrow}
        </p>
        <h1 className="font-serif-display mt-1 text-3xl text-[var(--color-charcoal)]">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-[var(--color-charcoal)]/60">{subtitle}</p>}
      </div>

      {children}

      {footer && <div className="mt-6 text-center text-sm text-[var(--color-charcoal)]/65">{footer}</div>}
    </main>
  );
}

export function AuthField({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-[var(--color-charcoal)]/80">{label}</span>
      <input
        className="h-12 rounded-xl border border-[var(--color-line)] bg-white/70 px-4 text-[var(--color-charcoal)] outline-none transition-colors placeholder:text-[var(--color-charcoal)]/35 focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold)]/25"
        {...props}
      />
    </label>
  );
}
