import { NextResponse } from "next/server";
import {
  getWineryStaffContext,
  getRepeatGuestStats,
  getWineryQrScanCount,
  getWineryPeriodTrends,
  getWineryConversionStats,
  EMPTY_CONVERSION_STATS,
  type PeriodTrendPoint,
} from "@/lib/portal";

function csvField(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function fmt(n: number | null | undefined, decimals = 0): string {
  return n == null ? "" : n.toFixed(decimals);
}

/** One CSV row per metric: its current value alongside the raw counts
 * behind the 7-day and 30-day trend badges shown on the portal dashboard
 * — left as plain numbers (not "+N" labels) so they're usable directly
 * in a spreadsheet. */
function metricRow(
  label: string,
  current: number | string,
  trend: PeriodTrendPoint | undefined,
  decimals = 0
): string[] {
  return [
    label,
    String(current),
    fmt(trend?.thisWeek, decimals),
    fmt(trend?.lastWeek, decimals),
    fmt(trend?.last30, decimals),
    fmt(trend?.prev30, decimals),
  ];
}

export async function GET() {
  const ctx = await getWineryStaffContext();
  if (!ctx) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const isSubscribed = ctx.winery.analytics_subscribed;
  const [guestStats, qrScans, trends, conversionStats] = await Promise.all([
    getRepeatGuestStats(ctx.winery.id),
    getWineryQrScanCount(ctx.winery.id),
    getWineryPeriodTrends(ctx.winery.id),
    isSubscribed ? getWineryConversionStats(ctx.winery.id) : Promise.resolve(EMPTY_CONVERSION_STATS),
  ]);

  const rows: string[][] = [
    ["Metric", "Current", "This Week", "Last Week", "Last 30 Days", "Previous 30 Days"],
    metricRow("Total Guests", guestStats.totalGuests, trends.total_guests),
    metricRow("QR Code Scans", qrScans, trends.qr_scans),
  ];

  if (isSubscribed) {
    const ctrNow =
      conversionStats.pageViews > 0
        ? Math.round((conversionStats.wineClubClicks / conversionStats.pageViews) * 100)
        : 0;
    rows.push(
      metricRow("One-Time Guests", guestStats.oneVisit, trends.one_time_guests),
      metricRow("Repeat Guests", guestStats.repeatGuests, trends.repeat_guests),
      metricRow("Page Views", conversionStats.pageViews, trends.page_views),
      metricRow("Wine Club Clicks", conversionStats.wineClubClicks, trends.wine_club_clicks),
      metricRow("Wine Club Click-Through Rate (%)", ctrNow, undefined),
      metricRow(
        "Avg Visitor Age",
        conversionStats.avgVisitorAge != null ? conversionStats.avgVisitorAge : "",
        trends.avg_visitor_age,
        1
      ),
      metricRow("Social Shares", conversionStats.shareEvents, trends.share_events),
      metricRow("Subscriber Guests", conversionStats.subscriberGuests, trends.subscriber_guests)
    );
  }

  const csv = rows.map((row) => row.map(csvField).join(",")).join("\n");

  const filenameSafeSlug = ctx.winery.slug.replace(/[^a-z0-9-]/gi, "");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filenameSafeSlug}-metrics-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
