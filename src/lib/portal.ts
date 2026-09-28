import "server-only";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { AGE_GROUPS, type AgeGroup } from "@/lib/utils";
import type { Winery } from "@/lib/types";

export interface WineryStaffContext {
  userId: string;
  winery: Winery;
}

/** Resolves the signed-in user's winery-portal context (their linked
 * winery), or null if they're not a winery-staff account. Every /portal
 * page and Server Action gates on this the same way admin pages gate on
 * isCurrentUserAdmin(). */
export async function getWineryStaffContext(): Promise<WineryStaffContext | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("winery_id")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile?.winery_id) return null;

    const { data: winery } = await supabase
      .from("wineries")
      .select("*")
      .eq("id", profile.winery_id)
      .maybeSingle();
    if (!winery) return null;

    return { userId: user.id, winery: winery as Winery };
  } catch {
    return null;
  }
}

/** For Server Actions: confirms the signed-in user is staff for exactly
 * this winery — never trust a wineryId passed from the client alone. */
export async function isCurrentUserStaffFor(wineryId: string): Promise<boolean> {
  const ctx = await getWineryStaffContext();
  return ctx?.winery.id === wineryId;
}

export interface RepeatGuestStats {
  oneVisit: number;
  twoVisits: number;
  threeOrMoreVisits: number;
  totalGuests: number;
  repeatGuests: number;
}

const EMPTY_STATS: RepeatGuestStats = {
  oneVisit: 0,
  twoVisits: 0,
  threeOrMoreVisits: 0,
  totalGuests: 0,
  repeatGuests: 0,
};

/** Aggregate-only repeat-visit counts for one winery — never individual
 * guest identities, via the winery_repeat_guest_stats() SECURITY DEFINER
 * function (it re-checks staff/admin access itself server-side). */
export async function getRepeatGuestStats(wineryId: string): Promise<RepeatGuestStats> {
  if (!isSupabaseConfigured) return EMPTY_STATS;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("winery_repeat_guest_stats", {
      target_winery_id: wineryId,
    });
    if (error || !data) throw error;

    const rows = data as { visit_bucket: string; guest_count: number }[];
    const oneVisit = rows.find((r) => r.visit_bucket === "1")?.guest_count ?? 0;
    const twoVisits = rows.find((r) => r.visit_bucket === "2")?.guest_count ?? 0;
    const threeOrMoreVisits = rows.find((r) => r.visit_bucket === "3+")?.guest_count ?? 0;

    return {
      oneVisit,
      twoVisits,
      threeOrMoreVisits,
      totalGuests: oneVisit + twoVisits + threeOrMoreVisits,
      repeatGuests: twoVisits + threeOrMoreVisits,
    };
  } catch {
    return EMPTY_STATS;
  }
}

export interface WineryConversionStats {
  pageViews: number;
  checkins: number;
  wineClubClicks: number;
  /** Average current age of guests who've checked in here, from the birth
   * date collected at signup — null until at least one checked-in guest
   * has one on file. */
  avgVisitorAge: number | null;
}

const EMPTY_CONVERSION_STATS: WineryConversionStats = {
  pageViews: 0,
  checkins: 0,
  wineClubClicks: 0,
  avgVisitorAge: null,
};

/** Aggregate-only page-view/checkin/wine-club-click counts for one winery,
 * via the winery_conversion_stats() SECURITY DEFINER function (it
 * re-checks staff/admin access itself server-side) — same pattern as
 * getRepeatGuestStats. Lets the portal show a wine club click-through
 * rate (clicks / views) since the Wine Club section renders regardless of
 * check-in status. */
export async function getWineryConversionStats(wineryId: string): Promise<WineryConversionStats> {
  if (!isSupabaseConfigured) return EMPTY_CONVERSION_STATS;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("winery_conversion_stats", {
      target_winery_id: wineryId,
    });
    if (error || !data || data.length === 0) throw error;

    const row = data[0] as {
      page_views: number;
      checkins: number;
      wine_club_clicks: number;
      avg_visitor_age: number | null;
    };
    return {
      pageViews: row.page_views,
      checkins: row.checkins,
      wineClubClicks: row.wine_club_clicks,
      avgVisitorAge: row.avg_visitor_age,
    };
  } catch {
    return EMPTY_CONVERSION_STATS;
  }
}

/** One row per AGE_GROUPS bucket, in that fixed display order, filling in
 * 0 for a bucket with no guests yet rather than omitting it. */
export async function getWineryAgeGroups(wineryId: string): Promise<{ ageGroup: AgeGroup; count: number }[]> {
  const empty = AGE_GROUPS.map((ageGroup) => ({ ageGroup, count: 0 }));
  if (!isSupabaseConfigured) return empty;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("winery_age_group_stats", {
      target_winery_id: wineryId,
    });
    if (error || !data) throw error;

    const rows = data as { age_group: string; guest_count: number }[];
    return AGE_GROUPS.map((ageGroup) => ({
      ageGroup,
      count: rows.find((r) => r.age_group === ageGroup)?.guest_count ?? 0,
    }));
  } catch {
    return empty;
  }
}

export interface WineryGuest {
  userId: string;
  name: string | null;
  email: string | null;
  visitCount: number;
  firstVisit: string;
  lastVisit: string;
}

/** Guests who've checked in at this winery — name, email, and visit
 * history, via the winery_guest_list() SECURITY DEFINER function (it
 * re-checks staff/admin access itself server-side). Disclosed in the Terms
 * of Service: a winery can see this for guests who visited that winery
 * specifically, not any other. */
export async function getWineryGuestList(wineryId: string): Promise<WineryGuest[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("winery_guest_list", { target_winery_id: wineryId });
    if (error || !data) throw error;

    return (
      data as { user_id: string; name: string | null; email: string | null; visit_count: number; first_visit: string; last_visit: string }[]
    ).map((r) => ({
      userId: r.user_id,
      name: r.name,
      email: r.email,
      visitCount: r.visit_count,
      firstVisit: r.first_visit,
      lastVisit: r.last_visit,
    }));
  } catch {
    return [];
  }
}
