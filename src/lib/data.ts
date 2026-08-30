import "server-only";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  DEFAULT_TRAIL_SLUG,
  SOUTH_NASHVILLE_TRAIL,
  PLACEHOLDER_TRAILS,
  SEED_WINERIES,
  SEED_WINES,
  SEED_WINERY_HOURS,
  SEED_REWARD_TIERS,
  SEED_WINERY_EVENTS,
} from "@/lib/seed-data";
import type {
  AppRating,
  Checkin,
  CheckinStatus,
  CustomWineTasting,
  Profile,
  RewardRedemption,
  RewardTier,
  Trail,
  Wine,
  WineTasting,
  WineWithTasting,
  Winery,
  WineryEvent,
  LockableWineryEvent,
  WineryEventGroup,
  WineryHours,
  WineryWithStatus,
} from "@/lib/types";

/** All trails a guest can browse on the Explore page, real ones first. */
export async function getAllTrails(): Promise<Trail[]> {
  if (!isSupabaseConfigured) return [SOUTH_NASHVILLE_TRAIL, ...PLACEHOLDER_TRAILS];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("trails")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: true });
    if (error || !data) throw error;
    return data as Trail[];
  } catch {
    return [SOUTH_NASHVILLE_TRAIL, ...PLACEHOLDER_TRAILS];
  }
}

export async function getTrailBySlug(slug: string): Promise<Trail | null> {
  if (!isSupabaseConfigured) {
    return [SOUTH_NASHVILLE_TRAIL, ...PLACEHOLDER_TRAILS].find((t) => t.slug === slug) ?? null;
  }
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("trails").select("*").eq("slug", slug).maybeSingle();
    return (data as Trail) ?? null;
  } catch {
    return null;
  }
}

/** All active wineries on the given trail, ordered for display. A trail
 * with no wineries mapped yet (a "coming soon" placeholder) returns []. */
export async function getTrailWineries(trailSlug: string = DEFAULT_TRAIL_SLUG): Promise<Winery[]> {
  if (!isSupabaseConfigured) {
    return trailSlug === DEFAULT_TRAIL_SLUG
      ? [...SEED_WINERIES].sort((a, b) => a.sort_order - b.sort_order)
      : [];
  }

  try {
    const supabase = await createClient();
    const { data: trail } = await supabase
      .from("trails")
      .select("id")
      .eq("slug", trailSlug)
      .maybeSingle();

    if (!trail) return trailSlug === DEFAULT_TRAIL_SLUG
      ? [...SEED_WINERIES].sort((a, b) => a.sort_order - b.sort_order)
      : [];

    const { data, error } = await supabase
      .from("trail_wineries")
      .select("display_order, wineries(*)")
      .eq("trail_id", trail.id)
      .order("display_order", { ascending: true });

    if (error || !data) throw error;

    return data
      .map((row) => row.wineries as unknown as Winery)
      .filter((w): w is Winery => !!w && w.active);
  } catch {
    return trailSlug === DEFAULT_TRAIL_SLUG
      ? [...SEED_WINERIES].sort((a, b) => a.sort_order - b.sort_order)
      : [];
  }
}

export async function getWineryBySlug(slug: string): Promise<Winery | null> {
  if (!isSupabaseConfigured) {
    return SEED_WINERIES.find((w) => w.slug === slug) ?? null;
  }
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("wineries").select("*").eq("slug", slug).single();
    return (data as Winery) ?? null;
  } catch {
    return SEED_WINERIES.find((w) => w.slug === slug) ?? null;
  }
}

export async function getWineryHours(wineryId: string): Promise<WineryHours[]> {
  if (!isSupabaseConfigured) {
    return SEED_WINERY_HOURS.filter((h) => h.winery_id === wineryId).sort(
      (a, b) => a.sort_order - b.sort_order
    );
  }
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("winery_hours")
      .select("*")
      .eq("winery_id", wineryId)
      .order("sort_order", { ascending: true });
    if (error || !data) throw error;
    return data as WineryHours[];
  } catch {
    return SEED_WINERY_HOURS.filter((h) => h.winery_id === wineryId).sort(
      (a, b) => a.sort_order - b.sort_order
    );
  }
}

export async function getCurrentUser() {
  if (!isSupabaseConfigured) return null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

export async function getProfile(userId: string): Promise<Profile | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    return (data as Profile) ?? null;
  } catch {
    return null;
  }
}

/** Count of people the current session's user referred who've actually
 * visited (their first check-in) — computed server-side via a SECURITY
 * DEFINER function keyed off auth.uid(), so we never need a broad RLS
 * policy exposing other guests' full profile rows. */
export async function getQualifyingReferralCount(): Promise<number> {
  if (!isSupabaseConfigured) return 0;
  try {
    const supabase = await createClient();
    const { data } = await supabase.rpc("count_qualifying_referrals");
    return typeof data === "number" ? data : 0;
  } catch {
    return 0;
  }
}

/** Every check-in the guest has ever made, most recent first — a guest can
 * now check in at the same winery more than once (one per 24 hours), so
 * this is no longer capped to one row per winery. */
export async function getUserCheckins(userId: string): Promise<Checkin[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("checkins")
      .select("*")
      .eq("user_id", userId)
      .order("checkin_date", { ascending: false });
    return (data as Checkin[]) ?? [];
  } catch {
    return [];
  }
}

function statusFor(checkin: Checkin | undefined, allComplete: boolean): CheckinStatus {
  if (!checkin) return "not_visited";
  return allComplete ? "completed" : "visited";
}

/** Merges trail wineries with the current user's check-in state. */
export async function getWineriesWithStatus(
  userId: string | null,
  trailSlug: string = DEFAULT_TRAIL_SLUG
): Promise<WineryWithStatus[]> {
  const wineries = await getTrailWineries(trailSlug);
  if (!userId) {
    return wineries.map((w) => ({ ...w, status: "not_visited" as const, checkin: null }));
  }

  const checkins = await getUserCheckins(userId);
  const allComplete = wineries.every((w) => checkins.some((c) => c.winery_id === w.id));

  return wineries.map((w) => {
    const checkin = checkins.find((c) => c.winery_id === w.id);
    return {
      ...w,
      status: statusFor(checkin, allComplete),
      checkin: checkin ?? null,
    };
  });
}

export async function getCustomWineTastings(userId: string): Promise<CustomWineTasting[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("custom_wine_tastings")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    return (data as CustomWineTasting[]) ?? [];
  } catch {
    return [];
  }
}

export async function getTrailCompletions(userId: string) {
  if (!isSupabaseConfigured) return [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("trail_completions")
      .select("*")
      .eq("user_id", userId)
      .order("completed_at", { ascending: true });
    return data ?? [];
  } catch {
    return [];
  }
}

/** All active wines across the trail's wineries, ordered for display. */
export async function getAllWines(): Promise<Wine[]> {
  if (!isSupabaseConfigured) {
    return [...SEED_WINES].sort((a, b) => a.sort_order - b.sort_order);
  }
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("wines")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true });
    if (error || !data) throw error;
    return data as Wine[];
  } catch {
    return [...SEED_WINES].sort((a, b) => a.sort_order - b.sort_order);
  }
}

export async function getUserWineTastings(userId: string): Promise<WineTasting[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("wine_tastings")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    return (data as WineTasting[]) ?? [];
  } catch {
    return [];
  }
}

/** Every tasting-flight wine merged with its winery and the current user's rating, if any. */
export async function getWinesWithTastings(
  userId: string | null,
  trailSlug: string = DEFAULT_TRAIL_SLUG
): Promise<WineWithTasting[]> {
  const [wines, wineries] = await Promise.all([getAllWines(), getTrailWineries(trailSlug)]);
  const wineryById = new Map(wineries.map((w) => [w.id, w]));
  const tastings = userId ? await getUserWineTastings(userId) : [];
  const tastingByWineId = new Map(tastings.map((t) => [t.wine_id, t]));

  return wines
    .map((wine) => {
      const winery = wineryById.get(wine.winery_id);
      if (!winery) return null;
      return {
        ...wine,
        winery,
        tasting: tastingByWineId.get(wine.id) ?? null,
      };
    })
    .filter((w): w is WineWithTasting => !!w);
}

export async function getTrailCompletion(userId: string, trailId: string) {
  if (!isSupabaseConfigured) return null;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("trail_completions")
      .select("*")
      .eq("user_id", userId)
      .eq("trail_id", trailId)
      .maybeSingle();
    return data;
  } catch {
    return null;
  }
}

/** All active reward tiers, ordered for display. */
export async function getActiveRewardTiers(): Promise<RewardTier[]> {
  if (!isSupabaseConfigured) {
    return SEED_REWARD_TIERS.filter((t) => t.active).sort((a, b) => a.sort_order - b.sort_order);
  }
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("reward_tiers")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true });
    if (error || !data) throw error;
    return data as RewardTier[];
  } catch {
    return SEED_REWARD_TIERS.filter((t) => t.active).sort((a, b) => a.sort_order - b.sort_order);
  }
}

export async function getUserRewardRedemptions(userId: string): Promise<RewardRedemption[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("reward_redemptions")
      .select("*")
      .eq("user_id", userId)
      .order("issued_at", { ascending: true });
    return (data as RewardRedemption[]) ?? [];
  } catch {
    return [];
  }
}

/** A guest can submit more than one rating over time, so this returns just
 * their most recent one — used to give the Profile page's rating widget a
 * starting point, not as "the" rating. */
export async function getUserAppRating(userId: string): Promise<AppRating | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("app_ratings")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return (data as AppRating) ?? null;
  } catch {
    return null;
  }
}

async function getAllWineryEvents(): Promise<WineryEvent[]> {
  if (!isSupabaseConfigured) return SEED_WINERY_EVENTS;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("winery_events").select("*");
    if (error || !data) throw error;
    return data as WineryEvent[];
  } catch {
    return SEED_WINERY_EVENTS;
  }
}

/** New events stay subscriber-only for this long after being added, before
 * becoming visible to everyone. */
const EARLY_ACCESS_HOURS = 72;

/** VIP events get a much longer subscriber-exclusive window than regular
 * events — that's the "early access" a Premium membership buys — before
 * opening up to everyone. */
const VIP_EARLY_ACCESS_HOURS = 240;

function isLocked(e: WineryEvent, isSubscriber: boolean): boolean {
  if (isSubscriber) return false;
  const windowHours = e.vip_only ? VIP_EARLY_ACCESS_HOURS : EARLY_ACCESS_HOURS;
  const cutoff = Date.now() - windowHours * 60 * 60 * 1000;
  return new Date(e.created_at).getTime() > cutoff;
}

/** Upcoming events grouped one entry per winery (trail order, including
 * wineries with none scheduled) — public, so it's fine to show a logged-out
 * Explore visitor too. Grouped rather than a single soonest-first list so a
 * winery with lots of upcoming events can't crowd the others out. VIP events
 * don't appear here — they're exclusive to the /vip page instead.
 *
 * Non-subscribers still see that an event exists during its early-access
 * window (date shown, details locked) rather than it being invisible —
 * a hidden event just looks like a bug, a locked one reads as a real
 * feature and doubles as an upsell. */
export async function getUpcomingEventsByWinery(
  isSubscriber = false,
  trailSlug: string = DEFAULT_TRAIL_SLUG
): Promise<WineryEventGroup[]> {
  const [events, wineries] = await Promise.all([getAllWineryEvents(), getTrailWineries(trailSlug)]);
  const todayISO = new Date().toISOString().slice(0, 10);

  const eventsByWinery = new Map<string, LockableWineryEvent[]>();
  for (const e of events) {
    if (e.event_date < todayISO || e.vip_only) continue;
    const list = eventsByWinery.get(e.winery_id) ?? [];
    list.push({ ...e, locked: isLocked(e, isSubscriber) });
    eventsByWinery.set(e.winery_id, list);
  }

  return wineries.map((w) => ({
    winery_id: w.id,
    winery_name: w.name,
    winery_slug: w.slug,
    events: (eventsByWinery.get(w.id) ?? []).sort((a, b) => a.event_date.localeCompare(b.event_date)),
  }));
}

/** One VIP event merged with its winery, for the /vip page. */
export interface VipEvent extends LockableWineryEvent {
  winery_name: string;
  winery_slug: string;
}

async function getAllActiveWineries(): Promise<Winery[]> {
  if (!isSupabaseConfigured) return SEED_WINERIES;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("wineries").select("*").eq("active", true);
    if (error || !data) throw error;
    return data as Winery[];
  } catch {
    return SEED_WINERIES;
  }
}

/** Every upcoming VIP event across every winery (not trail-scoped — VIP
 * access is a Premium perk, not tied to any one trail), soonest first. */
export async function getVipEvents(isSubscriber = false): Promise<VipEvent[]> {
  const [events, wineries] = await Promise.all([getAllWineryEvents(), getAllActiveWineries()]);
  const wineryById = new Map(wineries.map((w) => [w.id, w]));
  const todayISO = new Date().toISOString().slice(0, 10);

  return events
    .filter((e) => e.vip_only && e.event_date >= todayISO && wineryById.get(e.winery_id))
    .map((e) => {
      const winery = wineryById.get(e.winery_id)!;
      return { ...e, locked: isLocked(e, isSubscriber), winery_name: winery.name, winery_slug: winery.slug };
    })
    .sort((a, b) => a.event_date.localeCompare(b.event_date));
}
