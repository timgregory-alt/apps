import Link from "next/link";
import { Lock } from "lucide-react";
import { getWineryStaffContext, getWineryGuestList } from "@/lib/portal";
import { formatCheckinDate } from "@/lib/utils";
import { StatCard } from "@/components/analytics/StatCard";

export default async function PortalGuestsPage() {
  const ctx = await getWineryStaffContext();
  if (!ctx) return null;

  const guests = await getWineryGuestList(ctx.winery.id);
  const isSubscribed = ctx.winery.analytics_subscribed;
  const repeatGuests = guests.filter((g) => g.visitCount > 1).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif-display text-2xl text-[var(--color-charcoal)]">Guests</h1>
          <p className="mt-1 text-sm text-[var(--color-charcoal)]/55">
            Guests who&rsquo;ve checked in at {ctx.winery.name} — disclosed in the Terms of Service. This
            list is scoped to your winery only; you can&rsquo;t see visits to any other winery on the
            trail.
          </p>
        </div>
        {guests.length > 0 &&
          (isSubscribed ? (
            <a
              href="/api/portal/export-guests"
              className="shrink-0 rounded-full bg-[var(--color-burgundy)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-burgundy-deep)]"
            >
              Export Guest List (CSV)
            </a>
          ) : (
            <Link
              href="/portal/details"
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-charcoal)]/60 hover:border-[var(--color-gold)] hover:text-[var(--color-burgundy)]"
            >
              <Lock size={13} strokeWidth={2} />
              Export Guest List — Winery Analytics
            </Link>
          ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Guests" value={guests.length} />
        {isSubscribed && (
          <>
            <StatCard label="One-Time Guests" value={guests.length - repeatGuests} />
            <StatCard label="Repeat Guests" value={repeatGuests} />
          </>
        )}
      </div>

      {guests.length === 0 ? (
        <p className="text-sm text-[var(--color-charcoal)]/50">No check-ins yet.</p>
      ) : !isSubscribed ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-[var(--color-gold)]/40 bg-[var(--color-gold-pale)]/20 px-5 py-8 text-center">
          <Lock size={18} className="text-[var(--color-burgundy)]" strokeWidth={1.75} />
          <p className="text-sm font-medium text-[var(--color-charcoal)]">
            Guest names and emails require Winery Analytics
          </p>
          <p className="max-w-sm text-xs text-[var(--color-charcoal)]/60">
            Subscribe to see who&rsquo;s been checking in — names, emails, and visit history — not just
            the totals above.
          </p>
          <Link
            href="/portal/details"
            className="mt-2 rounded-full bg-[var(--color-burgundy)] px-4 py-2 text-xs font-medium text-white hover:bg-[var(--color-burgundy-deep)]"
          >
            Subscribe — $50/mo
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--color-line)] bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-line)] text-xs uppercase tracking-wide text-[var(--color-charcoal)]/50">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Visits</th>
                <th className="px-4 py-3 font-medium">First Visit</th>
                <th className="px-4 py-3 font-medium">Last Visit</th>
              </tr>
            </thead>
            <tbody>
              {guests.map((g) => (
                <tr key={g.userId} className="border-b border-[var(--color-line)] last:border-0">
                  <td className="px-4 py-3 text-[var(--color-charcoal)]">{g.name || "(no name)"}</td>
                  <td className="px-4 py-3 text-[var(--color-charcoal)]/70">{g.email}</td>
                  <td className="px-4 py-3 text-[var(--color-charcoal)]/70">{g.visitCount}</td>
                  <td className="px-4 py-3 text-[var(--color-charcoal)]/70">{formatCheckinDate(g.firstVisit)}</td>
                  <td className="px-4 py-3 text-[var(--color-charcoal)]/70">{formatCheckinDate(g.lastVisit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
