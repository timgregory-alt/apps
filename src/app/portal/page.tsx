import {
  getWineryStaffContext,
  getRepeatGuestStats,
  getWineryConversionStats,
  getWineryAgeGroups,
  getWineryVisitsByDayOfWeek,
  getWineryVisitsByDaypart,
  getWineryTopWines,
  getWineryGuestOrigins,
} from "@/lib/portal";
import { createClient } from "@/lib/supabase/server";
import { QrCode } from "@/components/ui/QrCode";
import { LabeledBars } from "@/components/analytics/LabeledBars";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-white px-5 py-4">
      <p className="font-serif-display text-3xl text-[var(--color-burgundy)]">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-[var(--color-charcoal)]/50">{label}</p>
    </div>
  );
}

export default async function PortalDashboardPage() {
  const ctx = await getWineryStaffContext();
  if (!ctx) return null;

  const supabase = await createClient();
  const todayISO = new Date().toISOString().slice(0, 10);
  const [
    { count: upcomingCount },
    { count: vipCount },
    guestStats,
    conversionStats,
    ageGroups,
    visitsByDayOfWeek,
    visitsByDaypart,
    topWines,
    guestOrigins,
  ] = await Promise.all([
    supabase
      .from("winery_events")
      .select("*", { count: "exact", head: true })
      .eq("winery_id", ctx.winery.id)
      .gte("event_date", todayISO),
    supabase
      .from("winery_events")
      .select("*", { count: "exact", head: true })
      .eq("winery_id", ctx.winery.id)
      .eq("vip_only", true)
      .gte("event_date", todayISO),
    getRepeatGuestStats(ctx.winery.id),
    getWineryConversionStats(ctx.winery.id),
    getWineryAgeGroups(ctx.winery.id),
    getWineryVisitsByDayOfWeek(ctx.winery.id),
    getWineryVisitsByDaypart(ctx.winery.id),
    getWineryTopWines(ctx.winery.id),
    getWineryGuestOrigins(ctx.winery),
  ]);

  const wineClubCTR =
    conversionStats.pageViews > 0
      ? `${Math.round((conversionStats.wineClubClicks / conversionStats.pageViews) * 100)}%`
      : "—";

  const qrUrl = `https://winetrailonline.com/winery/${ctx.winery.slug}`;

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      <div className="flex flex-1 flex-col gap-8">
        <div>
          <h1 className="font-serif-display text-2xl text-[var(--color-charcoal)]">{ctx.winery.name}</h1>
          <p className="mt-1 text-sm text-[var(--color-charcoal)]/55">
            Manage your events, wines, hours, links, and see how guests are returning.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Upcoming Events" value={upcomingCount ?? 0} />
          <StatCard label="Upcoming VIP Events" value={vipCount ?? 0} />
          <StatCard label="Total Guests" value={guestStats.totalGuests} />
          <StatCard label="One-Time Guests" value={guestStats.oneVisit} />
          <StatCard label="Repeat Guests" value={guestStats.repeatGuests} />
          <StatCard label="Page Views" value={conversionStats.pageViews} />
          <StatCard label="Wine Club Clicks" value={conversionStats.wineClubClicks} />
          <StatCard label="Wine Club Click-Through Rate" value={wineClubCTR} />
          <StatCard
            label="Avg Visitor Age"
            value={conversionStats.avgVisitorAge != null ? conversionStats.avgVisitorAge : "—"}
          />
          <StatCard label="Social Shares" value={conversionStats.shareEvents} />
          <StatCard label="Subscriber Guests" value={conversionStats.subscriberGuests} />
          <StatCard
            label="Avg Guest Distance"
            value={guestOrigins.avgDistanceMiles != null ? `${guestOrigins.avgDistanceMiles} mi` : "—"}
          />
        </div>
        <p className="-mt-5 text-xs text-[var(--color-charcoal)]/45">
          Click-through rate is wine club link clicks divided by winery page views. Page-view
          tracking is newly added, so this rate will read low until traffic accumulates.
        </p>

        <div>
          <h2 className="font-serif-display text-lg text-[var(--color-charcoal)]">Guest Age Groups</h2>
          <div className="mt-3">
            <LabeledBars bars={ageGroups.map((g) => ({ label: g.ageGroup, count: g.count }))} />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <h2 className="font-serif-display text-lg text-[var(--color-charcoal)]">Peak Visit Day</h2>
            <div className="mt-3">
              <LabeledBars bars={visitsByDayOfWeek} />
            </div>
          </div>
          <div>
            <h2 className="font-serif-display text-lg text-[var(--color-charcoal)]">Peak Visit Time</h2>
            <div className="mt-3">
              <LabeledBars bars={visitsByDaypart} />
            </div>
          </div>
        </div>

        <div>
          <h2 className="font-serif-display text-lg text-[var(--color-charcoal)]">Favorite Wines</h2>
          <p className="mt-1 mb-3 text-xs text-[var(--color-charcoal)]/55">Wines rated 4-5 stars by guests.</p>
          {topWines.length === 0 ? (
            <p className="text-sm text-[var(--color-charcoal)]/45">No wine ratings yet.</p>
          ) : (
            <LabeledBars bars={topWines.map((w) => ({ label: w.wineName, count: w.likedCount }))} />
          )}
        </div>

        <div>
          <h2 className="font-serif-display text-lg text-[var(--color-charcoal)]">Where Guests Come From</h2>
          {guestOrigins.topZips.length === 0 ? (
            <p className="mt-1 text-sm text-[var(--color-charcoal)]/45">No guest zip codes on file yet.</p>
          ) : (
            <div className="mt-3 flex flex-col gap-1.5">
              {guestOrigins.topZips.map((z) => (
                <div key={z.zipCode} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--color-charcoal)]/70">
                    {z.place ?? z.zipCode} <span className="text-[var(--color-charcoal)]/40">({z.zipCode})</span>
                  </span>
                  <span className="text-[var(--color-charcoal)]/50">
                    {z.guestCount} guest{z.guestCount === 1 ? "" : "s"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="w-full max-w-xs shrink-0 rounded-2xl border border-[var(--color-line)] bg-white p-5 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-charcoal)]/50">
          Tasting Room QR Code
        </p>
        <div className="mt-3 flex justify-center">
          <QrCode value={qrUrl} size={180} />
        </div>
        <p className="mt-3 break-all text-xs text-[var(--color-charcoal)]/45">{qrUrl}</p>
        <p className="mt-2 text-xs text-[var(--color-charcoal)]/45">
          Scanning opens your winery&rsquo;s profile. It doesn&rsquo;t count as a check-in — GPS
          verification is still required.
        </p>
      </div>
    </div>
  );
}
