import "server-only";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
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
