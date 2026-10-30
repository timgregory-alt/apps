import {
  getWineryStaffContext,
  getRepeatGuestStats,
  getWineryQrScanCount,
  getWineryWeeklyTrends,
  getWineryConversionStats,
  getWineryAgeGroups,
  getWineryVisitsByDayOfWeek,
  getWineryVisitsByDaypart,
  getWineryTopWines,
  getWineryGuestOrigins,
  getWineryFeedback,
  EMPTY_CONVERSION_STATS,
} from "@/lib/portal";
import { createClient } from "@/lib/supabase/server";
import { QrCode } from "@/components/ui/QrCode";
import { LabeledBars } from "@/components/analytics/LabeledBars";
import { StatCard } from "@/components/analytics/StatCard";
import { WineryAnalyticsUpsellCard } from "@/components/portal/WineryAnalyticsUpsellCard";
import { WineryFeedbackForm } from "@/components/portal/WineryFeedbackForm";
import { formatCheckinDate } from "@/lib/utils";
import { computeTrend } from "@/lib/trends";

export default async function PortalDashboardPage() {
  const ctx = await getWineryStaffContext();
  if (!ctx) return null;

  const isSubscribed = ctx.winery.analytics_subscribed;
  const supabase = await createClient();
  const todayISO = new Date().toISOString().slice(0, 10);
  const [
    { count: upcomingCount },
    { count: vipCount },
    guestStats,
    qrScans,
    trends,
    conversionStats,
    ageGroups,
    visitsByDayOfWeek,
    visitsByDaypart,
    topWines,
    guestOrigins,
    feedback,
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
    getWineryQrScanCount(ctx.winery.id),
    getWineryWeeklyTrends(ctx.winery.id),
    // Everything below is the paid analytics bundle — skip the RPCs
    // entirely for a non-subscribed winery rather than fetching data
    // that's just going to be hidden behind the upsell card.
    isSubscribed ? getWineryConversionStats(ctx.winery.id) : Promise.resolve(EMPTY_CONVERSION_STATS),
    isSubscribed ? getWineryAgeGroups(ctx.winery.id) : Promise.resolve([]),
    isSubscribed ? getWineryVisitsByDayOfWeek(ctx.winery.id) : Promise.resolve([]),
    isSubscribed ? getWineryVisitsByDaypart(ctx.winery.id) : Promise.resolve([]),
    isSubscribed ? getWineryTopWines(ctx.winery.id) : Promise.resolve([]),
    isSubscribed ? getWineryGuestOrigins(ctx.winery.id) : Promise.resolve({ topZips: [] }),
    getWineryFeedback(ctx.winery.id),
  ]);

  const wineClubCTR =
    conversionStats.pageViews > 0
      ? `${Math.round((conversionStats.wineClubClicks / conversionStats.pageViews) * 100)}%`
      : "—";

  // Wine Club CTR has no stored weekly row of its own — derive each
  // week's rate from that week's clicks/views and diff those.
  const pv = trends.page_views;
  const wc = trends.wine_club_clicks;
  const wineClubCTRTrend =
    pv && wc && pv.thisWeek != null && pv.lastWeek != null && wc.thisWeek != null && wc.lastWeek != null
      ? computeTrend(
          {
            thisWeek: pv.thisWeek > 0 ? Math.round((wc.thisWeek / pv.thisWeek) * 100) : 0,
            lastWeek: pv.lastWeek > 0 ? Math.round((wc.lastWeek / pv.lastWeek) * 100) : 0,
          },
          { unit: "%" }
        )
      : null;

  const qrUrl = `https://winetrailonline.com/winery/${ctx.winery.slug}?src=qr`;

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      <div className="flex flex-1 flex-col gap-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-charcoal)]/50">
            Welcome{ctx.name ? `, ${ctx.name}` : ""}
          </p>
          <h1 className="font-serif-display text-2xl text-[var(--color-charcoal)]">{ctx.winery.name}</h1>
          <p className="mt-1 text-sm text-[var(--color-charcoal)]/55">
            {ctx.email ? `Signed in as ${ctx.email} — manage` : "Manage"} your events, wines, hours,
            links, and see how guests are returning.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Upcoming Events" value={upcomingCount ?? 0} />
          <StatCard label="Upcoming VIP Events" value={vipCount ?? 0} />
          <StatCard
            label="Total Guests"
            value={guestStats.totalGuests}
            trend={computeTrend(trends.total_guests)}
          />
          <StatCard label="QR Code Scans" value={qrScans} trend={computeTrend(trends.qr_scans)} />
        </div>
        <p className="-mt-5 text-xs text-[var(--color-charcoal)]/45">
          QR Code Scans counts every time someone scans your tasting room code, even if they don&rsquo;t
          check in. Total Guests only counts people who actually checked in while at the winery.
        </p>

        <WineryAnalyticsUpsellCard isSubscribed={isSubscribed} />

        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
          <h2 className="font-serif-display text-lg text-[var(--color-charcoal)]">Feedback</h2>
          <p className="mt-1 text-xs text-[var(--color-charcoal)]/55">
            Tell us what&rsquo;s working, what&rsquo;s not, or what you&rsquo;d like to see next on the
            platform.
          </p>
          <div className="mt-3">
            <WineryFeedbackForm />
          </div>
          {feedback.length > 0 && (
            <div className="mt-4 flex flex-col gap-2 border-t border-[var(--color-line)] pt-4">
              {feedback.slice(0, 3).map((f) => (
                <div key={f.id} className="text-xs">
                  <p className="text-[var(--color-charcoal)]/40">{formatCheckinDate(f.created_at)}</p>
                  <p className="mt-0.5 text-[var(--color-charcoal)]/75">{f.feedback}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {isSubscribed && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard
                label="One-Time Guests"
                value={guestStats.oneVisit}
                trend={computeTrend(trends.one_time_guests)}
              />
              <StatCard
                label="Repeat Guests"
                value={guestStats.repeatGuests}
                trend={computeTrend(trends.repeat_guests)}
              />
              <StatCard
                label="Page Views"
                value={conversionStats.pageViews}
                trend={computeTrend(trends.page_views)}
              />
              <StatCard
                label="Wine Club Clicks"
                value={conversionStats.wineClubClicks}
                trend={computeTrend(trends.wine_club_clicks)}
              />
              <StatCard label="Wine Club Click-Through Rate" value={wineClubCTR} trend={wineClubCTRTrend} />
              <StatCard
                label="Avg Visitor Age"
                value={conversionStats.avgVisitorAge != null ? conversionStats.avgVisitorAge : "—"}
                trend={computeTrend(trends.avg_visitor_age, { decimals: 1, unit: " yrs" })}
              />
              <StatCard
                label="Social Shares"
                value={conversionStats.shareEvents}
                trend={computeTrend(trends.share_events)}
              />
              <StatCard
                label="Subscriber Guests"
                value={conversionStats.subscriberGuests}
                trend={computeTrend(trends.subscriber_guests)}
              />
              <StatCard
                label="Top Guest City"
                value={guestOrigins.topZips[0]?.place ?? guestOrigins.topZips[0]?.zipCode ?? "—"}
                caption={
                  guestOrigins.topZips[0]
                    ? `${guestOrigins.topZips[0].guestCount} guest${guestOrigins.topZips[0].guestCount === 1 ? "" : "s"}`
                    : undefined
                }
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
              <p className="mt-1 mb-3 text-xs text-[var(--color-charcoal)]/55">
                Wines rated 4-5 stars by guests.
              </p>
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
                        {z.place ?? z.zipCode}{" "}
                        <span className="text-[var(--color-charcoal)]/40">({z.zipCode})</span>
                      </span>
                      <span className="text-[var(--color-charcoal)]/50">
                        {z.guestCount} guest{z.guestCount === 1 ? "" : "s"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
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
