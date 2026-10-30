import { NextResponse } from "next/server";
import { isCurrentUserAdmin, getAdminStats, getAdminPeriodTrends } from "@/lib/admin";
import type { PeriodTrendPoint } from "@/lib/portal";

function csvField(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function fmt(n: number | null | undefined, decimals = 0): string {
  return n == null ? "" : n.toFixed(decimals);
}

/** One CSV row per metric: its current value alongside the raw counts
 * behind the 7-day and 30-day trend badges shown on the admin dashboard
 * — left as plain numbers (not "+N" labels) so they're usable directly
 * in a spreadsheet. */
function metricRow(label: string, current: number | string, trend: PeriodTrendPoint | undefined): string[] {
  return [label, String(current), fmt(trend?.thisWeek), fmt(trend?.lastWeek), fmt(trend?.last30), fmt(trend?.prev30)];
}

export async function GET() {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const [stats, trends] = await Promise.all([getAdminStats(), getAdminPeriodTrends()]);

  const completionRate = stats.totalAccounts > 0 ? Math.round((stats.totalCompletions / stats.totalAccounts) * 100) : 0;
  const wineClubCTR =
    stats.totalPageViews > 0 ? Math.round((stats.totalWineClubClicks / stats.totalPageViews) * 100) : 0;

  const rows: string[][] = [
    ["Metric", "Current", "This Week", "Last Week", "Last 30 Days", "Previous 30 Days"],
    metricRow("New Accounts", stats.totalAccounts, trends.new_accounts),
    metricRow("Total Check-ins", stats.totalCheckins, trends.checkins),
    metricRow("Trail Completions", stats.totalCompletions, trends.trail_completions),
    metricRow("Wine Club Clicks", stats.totalWineClubClicks, trends.wine_club_clicks),
    metricRow("Winery Page Views", stats.totalPageViews, trends.page_views),
    metricRow("QR Code Scans", stats.totalQrScans, trends.qr_scans),
    metricRow("Share Events", stats.totalShareEvents, trends.share_events),
    metricRow("Subscriber Guests", stats.totalSubscriberGuests, trends.subscriber_guests),
    metricRow("Completion Rate (%)", completionRate, undefined),
    metricRow("Wine Club Click-Through Rate (%)", wineClubCTR, undefined),
  ];
  const csv = rows.map((row) => row.map(csvField).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tn-wine-trails-metrics-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
