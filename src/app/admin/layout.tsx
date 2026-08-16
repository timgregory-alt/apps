import Link from "next/link";
import { isCurrentUserAdmin } from "@/lib/admin";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await isCurrentUserAdmin();

  if (!admin) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="font-serif-display text-2xl text-[var(--color-charcoal)]">Admin Access Required</p>
        <p className="text-sm text-[var(--color-charcoal)]/60">
          {isSupabaseConfigured
            ? "Sign in with an account that has is_admin set to true in the profiles table."
            : "Connect Supabase and set is_admin = true on your profile to access the admin dashboard."}
        </p>
        <Link href="/" className="mt-2 text-sm font-medium text-[var(--color-burgundy)] hover:underline">
          Return home
        </Link>
      </main>
    );
  }

  return (
    <div className="min-h-dvh bg-[var(--color-ivory-deep)]">
      <header className="border-b border-[var(--color-line)] bg-[var(--color-charcoal)] px-6 py-4 text-[var(--color-ivory)]">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/admin" className="font-serif-display text-lg">
            TN Wine Passport · Admin
          </Link>
          <nav className="flex items-center gap-5 text-sm">
            <Link href="/admin" className="hover:text-[var(--color-gold)]">
              Dashboard
            </Link>
            <Link href="/admin/wineries" className="hover:text-[var(--color-gold)]">
              Wineries
            </Link>
            <Link href="/" className="text-[var(--color-ivory)]/60 hover:text-[var(--color-gold)]">
              Exit Admin
            </Link>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-6 py-8">{children}</div>
    </div>
  );
}
