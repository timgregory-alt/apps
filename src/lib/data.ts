import "server-only";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  FOUNDING_TRAIL,
  SEED_WINERIES,
  SEED_WINES,
  SEED_WINERY_HOURS,
  SEED_REWARD_TIERS,
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
  WineryHours,
  WineryWithStatus,
} from "@/lib/types";

/** All active wineries on the Founding Trail, ordered for display. */
export async function getFoundingTrailWineries(): Promise<Winery[]> {
  if (!isSupabaseConfigured) {
    return [...SEED_WINERIES].sort((a, b) => a.sort_order - b.sort_order);
  }

  try {
    const supabase = await createClient();
    const { data: trail } = await supabase
      .from("trails")
      .select("id")
      .eq("slug", "founding-trail")
      .single();

    if (!trail) return [...SEED_WINERIES].sort((a, b) => a.sort_order - b.sort_order);

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
    return [...SEED_WINERIES].sort((a, b) => a.sort_order - b.sort_order);
  }
}

export async function getTrail(): Promise<Trail> {
  if (!isSupabaseConfigured) return FOUNDING_TRAIL;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("trails")
      .select("*")
      .eq("slug", "founding-trail")
      .single();
    return (data as Trail) ?? FOUNDING_TRAIL;
  } catch {
    return FOUNDING_TRAIL;
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

export async function getUserCheckins(userId: string): Promise<Checkin[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("checkins")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
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
export async function getWineriesWithStatus(userId: string | null): Promise<WineryWithStatus[]> {
  const wineries = await getFoundingTrailWineries();
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

export async function getPassportCompletions(userId: string) {
  if (!isSupabaseConfigured) return [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("passport_completions")
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
export async function getWinesWithTastings(userId: string | null): Promise<WineWithTasting[]> {
  const [wines, wineries] = await Promise.all([getAllWines(), getFoundingTrailWineries()]);
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

export async function getPassportCompletion(userId: string, trailId: string) {
  if (!isSupabaseConfigured) return null;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("passport_completions")
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

export async function getUserAppRating(userId: string): Promise<AppRating | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("app_ratings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    return (data as AppRating) ?? null;
  } catch {
    return null;
  }
}
