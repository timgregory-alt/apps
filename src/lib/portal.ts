import "server-only";
import zipcodes from "zipcodes";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { AGE_GROUPS, type AgeGroup } from "@/lib/utils";
import { haversineMeters, metersToMiles } from "@/lib/geo";
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
  shareEvents: number;
  /** Distinct checked-in guests who are current Premium subscribers. */
  subscriberGuests: number;
}

const EMPTY_CONVERSION_STATS: WineryConversionStats = {
  pageViews: 0,
  checkins: 0,
  wineClubClicks: 0,
  avgVisitorAge: null,
  shareEvents: 0,
  subscriberGuests: 0,
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
      share_events: number;
      subscriber_guests: number;
    };
    return {
      pageViews: row.page_views,
      checkins: row.checkins,
      wineClubClicks: row.wine_club_clicks,
      avgVisitorAge: row.avg_visitor_age,
      shareEvents: row.share_events,
      subscriberGuests: row.subscriber_guests,
    };
  } catch {
    return EMPTY_CONVERSION_STATS;
  }
}

const DAY_OF_WEEK_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYPART_LABELS = ["Morning (6am-12pm)", "Afternoon (12-5pm)", "Evening (5-9pm)", "Night (9pm-6am)"];

/** Check-in counts by day of week, always all 7 in Sun..Sat order. */
export async function getWineryVisitsByDayOfWeek(wineryId: string): Promise<{ label: string; count: number }[]> {
  const empty = DAY_OF_WEEK_LABELS.map((label) => ({ label, count: 0 }));
  if (!isSupabaseConfigured) return empty;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("winery_visits_by_day_of_week", {
      target_winery_id: wineryId,
    });
    if (error || !data) throw error;
    const rows = data as { day_label: string; visit_count: number }[];
    return DAY_OF_WEEK_LABELS.map((label) => ({
      label,
      count: rows.find((r) => r.day_label === label)?.visit_count ?? 0,
    }));
  } catch {
    return empty;
  }
}

/** Check-in counts by time of day, always all 4 dayparts in order. */
export async function getWineryVisitsByDaypart(wineryId: string): Promise<{ label: string; count: number }[]> {
  const empty = DAYPART_LABELS.map((label) => ({ label, count: 0 }));
  if (!isSupabaseConfigured) return empty;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("winery_visits_by_daypart", {
      target_winery_id: wineryId,
    });
    if (error || !data) throw error;
    const rows = data as { daypart: string; visit_count: number }[];
    return DAYPART_LABELS.map((label) => ({
      label,
      count: rows.find((r) => r.daypart === label)?.visit_count ?? 0,
    }));
  } catch {
    return empty;
  }
}

export interface WineryTopWine {
  wineName: string;
  likedCount: number;
}

/** Top 5 wines by "liked" (4-5 star) ratings at this winery. */
export async function getWineryTopWines(wineryId: string): Promise<WineryTopWine[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("winery_top_wines", { target_winery_id: wineryId });
    if (error || !data) throw error;
    return (data as { wine_name: string; liked_count: number }[]).map((r) => ({
      wineName: r.wine_name,
      likedCount: r.liked_count,
    }));
  } catch {
    return [];
  }
}

export interface WineryGuestOrigins {
  /** Average distance in miles from this winery to guests' home zip
   * codes — null until at least one guest's zip resolves to a known
   * location. */
  avgDistanceMiles: number | null;
  /** Top 5 zip codes by guest count, with the nearest city/state name
   * where the zipcodes package recognizes it. */
  topZips: { zipCode: string; guestCount: number; place: string | null }[];
}

/** Distance/origin insight from guest home zip codes (collected at
 * signup) — geocoded and measured client-side via the zipcodes package
 * and the same haversine math used for check-in geofencing, since the
 * database only needs to hand back raw zip codes. */
export async function getWineryGuestOrigins(winery: Winery): Promise<WineryGuestOrigins> {
  const empty: WineryGuestOrigins = { avgDistanceMiles: null, topZips: [] };
  if (!isSupabaseConfigured) return empty;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("winery_guest_zip_codes", {
      target_winery_id: winery.id,
    });
    if (error || !data) throw error;

    const rows = data as { zip_code: string; guest_count: number }[];
    const distances: number[] = [];
    const topZips = rows.slice(0, 5).map((r) => {
      const location = zipcodes.lookup(r.zip_code.trim().slice(0, 5));
      return {
        zipCode: r.zip_code,
        guestCount: r.guest_count,
        place: location ? `${location.city}, ${location.state}` : null,
      };
    });

    rows.forEach((r) => {
      const location = zipcodes.lookup(r.zip_code.trim().slice(0, 5));
      if (!location) return;
      const miles = metersToMiles(
        haversineMeters(winery.latitude, winery.longitude, location.latitude, location.longitude)
      );
      for (let i = 0; i < r.guest_count; i++) distances.push(miles);
    });

    const avgDistanceMiles =
      distances.length > 0
        ? Math.round((distances.reduce((sum, d) => sum + d, 0) / distances.length) * 10) / 10
        : null;

    return { avgDistanceMiles, topZips };
  } catch {
    return empty;
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
