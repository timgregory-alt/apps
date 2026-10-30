import {
  getAdminStats,
  getAdminPeriodTrends,
  getAllWineriesAdmin,
  getWineLikeStats,
  getAppRatingStats,
  getWineryFeedbackAdmin,
  getAllMembersAdmin,
  LIKED_RATING_THRESHOLD,
} from "@/lib/admin";
import {
  archiveAppFeedbackAction,
  deleteAppFeedbackAction,
  archiveWineryFeedbackAction,
  deleteWineryFeedbackAction,
} from "@/app/admin/actions";
import { formatCheckinDate } from "@/lib/utils";
import { computeTrend, computeTrend30 } from "@/lib/trends";
import { LabeledBars } from "@/components/analytics/LabeledBars";
import { StatCard } from "@/components/analytics/StatCard";
import { FeedbackActions } from "@/components/admin/FeedbackActions";
import { QrCode } from "@/components/ui/QrCode";

export default async function AdminDashboardPage() {
  const [stats, trends, wineries, wineLikeStats, appRatingStats, wineryFeedback, members] = await Promise.all([
    getAdminStats(),
    getAdminPeriodTrends(),
    getAllWineriesAdmin(),
    getWineLikeStats(),
    getAppRatingStats(),
    getWineryFeedbackAdmin(),
    getAllMembersAdmin(),
  ]);

  const mostPopular = Object.entries(stats.checkinsByWinery).sort((a, b) => b[1] - a[1])[0];
  const mostPopularWinery = wineries.find((w) => w.id === mostPopular?.[0]);
  const termsAgreedCount = members.filter((m) => m.agreed_to_terms_at).length;

  // Completion Rate and Wine Club CTR have no stored row of their own —
  // derive each period's rate from that period's two raw counts and diff
  // those, same approach as the winery portal dashboard.
  const accounts = trends.new_accounts;
  const completions = trends.trail_completions;
  const completionRateTrend =
    accounts &&
    completions &&
    accounts.thisWeek != null &&
    accounts.lastWeek != null &&
    completions.thisWeek != null &&
    completions.lastWeek != null
      ? computeTrend(
          {
            thisWeek: accounts.thisWeek > 0 ? Math.round((completions.thisWeek / accounts.thisWeek) * 100) : 0,
            lastWeek: accounts.lastWeek > 0 ? Math.round((completions.lastWeek / accounts.lastWeek) * 100) : 0,
          },
          { unit: "%" }
        )
      : null;
  const completionRateTrend30 =
    accounts && completions && accounts.last30 != null && accounts.prev30 != null &&
    completions.last30 != null && completions.prev30 != null
      ? computeTrend30(
          {
            last30: accounts.last30 > 0 ? Math.round((completions.last30 / accounts.last30) * 100) : 0,
            prev30: accounts.prev30 > 0 ? Math.round((completions.prev30 / accounts.prev30) * 100) : 0,
          },
          { unit: "%" }
        )
      : null;

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
  const wineClubCTRTrend30 =
    pv && wc && pv.last30 != null && pv.prev30 != null && wc.last30 != null && wc.prev30 != null
      ? computeTrend30(
          {
            last30: pv.last30 > 0 ? Math.round((wc.last30 / pv.last30) * 100) : 0,
            prev30: pv.prev30 > 0 ? Math.round((wc.prev30 / pv.prev30) * 100) : 0,
          },
          { unit: "%" }
        )
      : null;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif-display text-2xl text-[var(--color-charcoal)]">Overview</h1>
          <p className="mt-1 text-sm text-[var(--color-charcoal)]/55">
            Traffic, engagement, and conversion across the trail.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <a
            href="/api/admin/export-metrics"
            className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-charcoal)]/70 hover:border-[var(--color-gold)] hover:text-[var(--color-burgundy)]"
          >
            Export Metrics (CSV)
          </a>
          <a
            href="/api/admin/export-members"
            className="rounded-full bg-[var(--color-burgundy)] px-4 py-2 text-sm font-medium text-[var(--color-ivory)] hover:bg-[var(--color-burgundy-deep)]"
          >
            Export Member List (CSV)
          </a>
        </div>
      </div>

      <div className="w-full max-w-xs rounded-2xl border border-[var(--color-line)] bg-white p-5 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-charcoal)]/50">
          General App QR Code
        </p>
        <div className="mt-3 flex justify-center">
          <QrCode
            value="https://winetrailonline.com"
            size={160}
            downloadable
            filename="winetrailonline-qr"
          />
        </div>
        <p className="mt-3 break-all text-xs text-[var(--color-charcoal)]/45">https://winetrailonline.com</p>
        <p className="mt-2 text-xs text-[var(--color-charcoal)]/45">
          Not tied to any winery — use this on banners, cards, or signage you might move between
          locations.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="New Accounts"
          value={stats.totalAccounts}
          trend={computeTrend(trends.new_accounts)}
          trend30={computeTrend30(trends.new_accounts)}
        />
        <StatCard
          label="Total Check-ins"
          value={stats.totalCheckins}
          trend={computeTrend(trends.checkins)}
          trend30={computeTrend30(trends.checkins)}
        />
        <StatCard
          label="Trail Completions"
          value={stats.totalCompletions}
          trend={computeTrend(trends.trail_completions)}
          trend30={computeTrend30(trends.trail_completions)}
        />
        <StatCard
          label="Wine Club Clicks"
          value={stats.totalWineClubClicks}
          trend={computeTrend(trends.wine_club_clicks)}
          trend30={computeTrend30(trends.wine_club_clicks)}
        />
        <StatCard
          label="Winery Page Views"
          value={stats.totalPageViews}
          trend={computeTrend(trends.page_views)}
          trend30={computeTrend30(trends.page_views)}
        />
        <StatCard
          label="QR Code Scans"
          value={stats.totalQrScans}
          trend={computeTrend(trends.qr_scans)}
          trend30={computeTrend30(trends.qr_scans)}
        />
        <StatCard
          label="Share Events"
          value={stats.totalShareEvents}
          trend={computeTrend(trends.share_events)}
          trend30={computeTrend30(trends.share_events)}
        />
        <StatCard label="Multi-Winery Visitors" value={stats.multiWineryVisitors} />
        <StatCard
          label="Most Popular Winery"
          value={mostPopularWinery?.name ?? "—"}
        />
        <StatCard
          label="Completion Rate"
          value={
            stats.totalAccounts > 0
              ? `${Math.round((stats.totalCompletions / stats.totalAccounts) * 100)}%`
              : "—"
          }
          trend={completionRateTrend}
          trend30={completionRateTrend30}
        />
        <StatCard
          label="Wine Club Click-Through Rate"
          value={
            stats.totalPageViews > 0
              ? `${Math.round((stats.totalWineClubClicks / stats.totalPageViews) * 100)}%`
              : "—"
          }
          trend={wineClubCTRTrend}
          trend30={wineClubCTRTrend30}
        />
        <StatCard
          label="Avg App Rating"
          value={appRatingStats.count > 0 ? `${appRatingStats.average.toFixed(1)} ★ (${appRatingStats.count})` : "—"}
        />
        <StatCard
          label="Terms Agreed"
          value={members.length > 0 ? `${termsAgreedCount} / ${members.length}` : "—"}
        />
        <StatCard
          label="Average Guest Age"
          value={stats.averageGuestAge != null ? stats.averageGuestAge : "—"}
        />
        <StatCard label="Single-Winery Day Trips" value={stats.singleWineryDayTrips} />
        <StatCard label="Multi-Winery Day Trips" value={stats.multiWineryDayTrips} />
        <StatCard
          label="Multi-Winery Trip Rate"
          value={
            stats.singleWineryDayTrips + stats.multiWineryDayTrips > 0
              ? `${Math.round(
                  (stats.multiWineryDayTrips / (stats.singleWineryDayTrips + stats.multiWineryDayTrips)) * 100
                )}%`
              : "—"
          }
        />
        <StatCard
          label="Subscriber Guests"
          value={stats.totalSubscriberGuests}
          trend={computeTrend(trends.subscriber_guests)}
          trend30={computeTrend30(trends.subscriber_guests)}
        />
      </div>
      <p className="-mt-5 text-xs text-[var(--color-charcoal)]/45">
        Wine Club Click-Through Rate is wine club link clicks divided by winery page views.
        Page-view tracking is newly added, so this rate will read low until traffic accumulates.
      </p>

      <div>
        <h2 className="font-serif-display text-xl text-[var(--color-charcoal)]">Guest Age Groups</h2>
        <div className="mt-3 rounded-2xl border border-[var(--color-line)] bg-white p-5">
          <LabeledBars bars={stats.guestAgeGroups.map((g) => ({ label: g.ageGroup, count: g.count }))} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <h2 className="font-serif-display text-xl text-[var(--color-charcoal)]">Peak Visit Day</h2>
          <div className="mt-3 rounded-2xl border border-[var(--color-line)] bg-white p-5">
            <LabeledBars bars={stats.visitsByDayOfWeek} />
          </div>
        </div>
        <div>
          <h2 className="font-serif-display text-xl text-[var(--color-charcoal)]">Peak Visit Time</h2>
          <div className="mt-3 rounded-2xl border border-[var(--color-line)] bg-white p-5">
            <LabeledBars bars={stats.visitsByDaypart} />
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-serif-display text-xl text-[var(--color-charcoal)]">By Winery</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-[var(--color-line)] bg-white">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="border-b border-[var(--color-line)] text-xs uppercase tracking-wide text-[var(--color-charcoal)]/50">
              <tr>
                <th className="px-4 py-3 font-medium">Winery</th>
                <th className="px-4 py-3 font-medium">Page Views</th>
                <th className="px-4 py-3 font-medium">QR Scans</th>
                <th className="px-4 py-3 font-medium">Check-ins</th>
                <th className="px-4 py-3 font-medium">Wine Club Clicks</th>
                <th className="px-4 py-3 font-medium">Wine Club CTR</th>
                <th className="px-4 py-3 font-medium">Shares</th>
                <th className="px-4 py-3 font-medium">Subscriber Guests</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {wineries.map((w) => {
                const views = stats.pageViewsByWinery[w.id] ?? 0;
                const clicks = stats.wineClubClicksByWinery[w.id] ?? 0;
                return (
                <tr key={w.id} className="border-b border-[var(--color-line)] last:border-0">
                  <td className="px-4 py-3">{w.name}</td>
                  <td className="px-4 py-3">{views}</td>
                  <td className="px-4 py-3">{stats.qrScansByWinery[w.id] ?? 0}</td>
                  <td className="px-4 py-3">{stats.checkinsByWinery[w.id] ?? 0}</td>
                  <td className="px-4 py-3">{clicks}</td>
                  <td className="px-4 py-3">
                    {views > 0 ? `${Math.round((clicks / views) * 100)}%` : "—"}
                  </td>
                  <td className="px-4 py-3">{stats.shareEventsByWinery[w.id] ?? 0}</td>
                  <td className="px-4 py-3">{stats.subscriberGuestsByWinery[w.id] ?? 0}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        w.active
                          ? "rounded-full bg-[var(--color-gold-pale)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-burgundy-deep)]"
                          : "rounded-full bg-black/5 px-2.5 py-0.5 text-xs font-medium text-[var(--color-charcoal)]/50"
                      }
                    >
                      {w.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="font-serif-display text-xl text-[var(--color-charcoal)]">Most Liked</h2>
        <p className="mt-1 text-sm text-[var(--color-charcoal)]/55">
          A {LIKED_RATING_THRESHOLD}-5 star rating counts as &ldquo;liked.&rdquo;
        </p>

        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div className="overflow-x-auto rounded-2xl border border-[var(--color-line)] bg-white">
            <table className="w-full min-w-[320px] text-left text-sm">
              <thead className="border-b border-[var(--color-line)] text-xs uppercase tracking-wide text-[var(--color-charcoal)]/50">
                <tr>
                  <th className="px-4 py-3 font-medium">Winery</th>
                  <th className="px-4 py-3 font-medium">Wines Liked</th>
                </tr>
              </thead>
              <tbody>
                {wineLikeStats.byWinery.map((w) => (
                  <tr key={w.wineryId} className="border-b border-[var(--color-line)] last:border-0">
                    <td className="px-4 py-3">{w.wineryName}</td>
                    <td className="px-4 py-3">{w.likedCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[var(--color-line)] bg-white">
            <table className="w-full min-w-[320px] text-left text-sm">
              <thead className="border-b border-[var(--color-line)] text-xs uppercase tracking-wide text-[var(--color-charcoal)]/50">
                <tr>
                  <th className="px-4 py-3 font-medium">Wine</th>
                  <th className="px-4 py-3 font-medium">Winery</th>
                  <th className="px-4 py-3 font-medium">Liked</th>
                </tr>
              </thead>
              <tbody>
                {wineLikeStats.topWines.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-[var(--color-charcoal)]/45">
                      No liked wines yet.
                    </td>
                  </tr>
                ) : (
                  wineLikeStats.topWines.map((w) => (
                    <tr key={w.wineId} className="border-b border-[var(--color-line)] last:border-0">
                      <td className="px-4 py-3">{w.wineName}</td>
                      <td className="px-4 py-3 text-[var(--color-charcoal)]/60">{w.wineryName}</td>
                      <td className="px-4 py-3">{w.likedCount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-serif-display text-xl text-[var(--color-charcoal)]">App Feedback</h2>
        <p className="mt-1 text-sm text-[var(--color-charcoal)]/55">
          {appRatingStats.count > 0
            ? `${appRatingStats.average.toFixed(1)} average from ${appRatingStats.count} rating${appRatingStats.count === 1 ? "" : "s"}.`
            : "No ratings yet."}
        </p>

        {appRatingStats.recentFeedback.length > 0 && (
          <div className="mt-3 flex flex-col gap-3">
            {appRatingStats.recentFeedback.map((f) => (
              <div
                key={f.id}
                className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[var(--color-gold)]">
                      {"★".repeat(f.rating)}
                      {"☆".repeat(5 - f.rating)}
                    </span>
                    <span className="ml-2 text-xs text-[var(--color-charcoal)]/45">
                      {formatCheckinDate(f.created_at)}
                    </span>
                  </div>
                  <FeedbackActions id={f.id} archiveAction={archiveAppFeedbackAction} deleteAction={deleteAppFeedbackAction} />
                </div>
                <p className="mt-1.5 text-xs font-medium text-[var(--color-charcoal)]/60">
                  {f.memberName}
                  {f.memberEmail && f.memberEmail !== f.memberName ? ` · ${f.memberEmail}` : ""}
                  {f.memberCity ? ` · ${f.memberCity}` : ""}
                </p>
                {f.feedback && (
                  <p className="mt-0.5 text-[var(--color-charcoal)]/80">{f.feedback}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-serif-display text-xl text-[var(--color-charcoal)]">Winery Feedback</h2>
        <p className="mt-1 text-sm text-[var(--color-charcoal)]/55">
          Feedback about the platform itself, sent by winery staff from their portal.
        </p>

        {wineryFeedback.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--color-charcoal)]/45">No feedback yet.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {wineryFeedback.map((f) => (
              <div
                key={f.id}
                className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-[var(--color-charcoal)]/60">{f.wineryName}</p>
                    <p className="text-xs text-[var(--color-charcoal)]/45">{formatCheckinDate(f.created_at)}</p>
                  </div>
                  <FeedbackActions id={f.id} archiveAction={archiveWineryFeedbackAction} deleteAction={deleteWineryFeedbackAction} />
                </div>
                <p className="mt-1.5 text-[var(--color-charcoal)]/80">{f.feedback}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {stats.totalAccounts === 0 && (
        <p className="text-sm text-[var(--color-charcoal)]/45">
          No analytics yet — figures populate once Supabase is connected and guests start
          checking in.
        </p>
      )}
    </div>
  );
}
