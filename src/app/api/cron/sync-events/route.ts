import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { syncAllWineryEvents } from "@/lib/event-sync";

export const maxDuration = 300;

// Vercel Cron has no native "every 2 weeks" schedule — day-of-month step
// values (e.g. */14) drift across month boundaries instead of landing
// reliably every other week. So the trigger stays weekly (same as
// sync-wines) and this route just skips every other run, counted from a
// fixed Monday reference so the cadence never drifts.
const BIWEEKLY_REFERENCE = Date.UTC(2026, 0, 5); // a Monday
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

function isSyncWeek(now: Date): boolean {
  const weeksSinceReference = Math.floor((now.getTime() - BIWEEKLY_REFERENCE) / MS_PER_WEEK);
  return weeksSinceReference % 2 === 0;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSyncWeek(new Date())) {
    return NextResponse.json({ skipped: true, reason: "Off week — runs every other Monday" });
  }

  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 200 });
  }

  try {
    const results = await syncAllWineryEvents();
    const totalAdded = results.reduce((sum, r) => sum + r.added, 0);
    return NextResponse.json({ totalAdded, results });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
