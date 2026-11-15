import Link from "next/link";
import { getWineryStaffContext } from "@/lib/portal";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { WinerySwitcher } from "@/components/portal/WinerySwitcher";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getWineryStaffContext();

  if (!ctx) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="font-serif-display text-2xl text-[var(--color-charcoal)]">Winery Portal Access Required</p>
        <p className="text-sm text-[var(--color-charcoal)]/60">
          {isSupabaseConfigured
            ? "Sign in with an account that's linked to a winery. If you run a winery on the trail and don't have access yet, ask the trail admin to set it up."
            : "Connect Supabase and link your profile to a winery to access the portal."}
        </p>
        <div className="mt-2 flex items-center gap-4">
          <Link href="/login?redirectTo=/portal" className="text-sm font-medium text-[var(--color-burgundy)] hover:underline">
            Sign in
          </Link>
          <Link
            href={`/reset-password?next=${encodeURIComponent("/portal")}`}
            className="text-sm text-[var(--color-charcoal)]/55 hover:text-[var(--color-burgundy)]"
          >
            Forgot password?
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-dvh bg-[var(--color-ivory-deep)]">
      <header className="border-b border-[var(--color-line)] bg-[var(--color-charcoal)] px-6 py-4 text-[var(--color-ivory)]">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-[var(--color-ivory)]/45">
              Portal
            </span>
            {ctx.accessibleWineries.length > 1 ? (
              <WinerySwitcher wineries={ctx.accessibleWineries} activeId={ctx.winery.id} />
            ) : (
              <Link href="/portal" className="font-serif-display text-lg leading-tight">
                {ctx.winery.name}
              </Link>
            )}
          </div>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <Link href="/portal" className="hover:text-[var(--color-gold)]">
              Dashboard
            </Link>
            <Link href="/portal/redeem" className="hover:text-[var(--color-gold)]">
              Redeem
            </Link>
            <Link href="/portal/events" className="hover:text-[var(--color-gold)]">
              Events
            </Link>
            <Link href="/portal/wines" className="hover:text-[var(--color-gold)]">
              Wines
            </Link>
            <Link href="/portal/details" className="hover:text-[var(--color-gold)]">
              Details
            </Link>
            <Link href="/portal/guests" className="hover:text-[var(--color-gold)]">
              Guests
            </Link>
            <Link href="/" className="text-[var(--color-ivory)]/60 hover:text-[var(--color-gold)]">
              Exit Portal
            </Link>
            <SignOutButton
              variant="link"
              className="text-[var(--color-ivory)]/60 hover:text-[var(--color-gold)]"
            />
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-6 py-8">{children}</div>
    </div>
  );
}
