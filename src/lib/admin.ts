import "server-only";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { SEED_WINERIES, SEED_WINES, SEED_REWARD_TIERS } from "@/lib/seed-data";
import type { Winery, Wine, RewardTier } from "@/lib/types";

export async function isCurrentUserAdmin(): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;
    const { data } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
    return !!data?.is_admin;
  } catch {
    return false;
  }
}

export interface AdminStats {
  totalAccounts: number;
  totalCheckins: number;
  totalCompletions: number;
  totalWineClubClicks: number;
  totalShareEvents: number;
  checkinsByWinery: Record<string, number>;
  wineClubClicksByWinery: Record<string, number>;
  shareEventsByType: Record<string, number>;
  multiWineryVisitors: number;
}

const EMPTY_STATS: AdminStats = {
  totalAccounts: 0,
  totalCheckins: 0,
  totalCompletions: 0,
  totalWineClubClicks: 0,
  totalShareEvents: 0,
  checkinsByWinery: {},
  wineClubClicksByWinery: {},
  shareEventsByType: {},
  multiWineryVisitors: 0,
};

export async function getAdminStats(): Promise<AdminStats> {
  if (!isSupabaseConfigured) return EMPTY_STATS;
  try {
    const supabase = await createClient();

    const [{ count: totalAccounts }, { data: checkins }, { count: totalCompletions }, { data: clicks }, { data: shares }] =
      await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("checkins").select("winery_id, user_id"),
        supabase.from("passport_completions").select("*", { count: "exact", head: true }),
        supabase.from("wine_club_clicks").select("winery_id"),
        supabase.from("share_events").select("share_type"),
      ]);

    const checkinsByWinery: Record<string, number> = {};
    const perUserCounts: Record<string, number> = {};
    (checkins ?? []).forEach((c) => {
      checkinsByWinery[c.winery_id] = (checkinsByWinery[c.winery_id] ?? 0) + 1;
      perUserCounts[c.user_id] = (perUserCounts[c.user_id] ?? 0) + 1;
    });
    const multiWineryVisitors = Object.values(perUserCounts).filter((n) => n > 1).length;

    const wineClubClicksByWinery: Record<string, number> = {};
    (clicks ?? []).forEach((c) => {
      wineClubClicksByWinery[c.winery_id] = (wineClubClicksByWinery[c.winery_id] ?? 0) + 1;
    });

    const shareEventsByType: Record<string, number> = {};
    (shares ?? []).forEach((s) => {
      shareEventsByType[s.share_type] = (shareEventsByType[s.share_type] ?? 0) + 1;
    });

    return {
      totalAccounts: totalAccounts ?? 0,
      totalCheckins: (checkins ?? []).length,
      totalCompletions: totalCompletions ?? 0,
      totalWineClubClicks: (clicks ?? []).length,
      totalShareEvents: (shares ?? []).length,
      checkinsByWinery,
      wineClubClicksByWinery,
      shareEventsByType,
      multiWineryVisitors,
    };
  } catch {
    return EMPTY_STATS;
  }
}

export async function getAllWineriesAdmin(): Promise<Winery[]> {
  if (!isSupabaseConfigured) return SEED_WINERIES;
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("wineries").select("*").order("sort_order");
    return (data as Winery[]) ?? [];
  } catch {
    return SEED_WINERIES;
  }
}

export async function getWineryByIdAdmin(id: string): Promise<Winery | null> {
  if (!isSupabaseConfigured) return SEED_WINERIES.find((w) => w.id === id) ?? null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("wineries").select("*").eq("id", id).single();
    return (data as Winery) ?? null;
  } catch {
    return null;
  }
}

export async function getWineryWinesAdmin(wineryId: string): Promise<Wine[]> {
  if (!isSupabaseConfigured) {
    return SEED_WINES.filter((w) => w.winery_id === wineryId).sort((a, b) => a.sort_order - b.sort_order);
  }
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("wines")
      .select("*")
      .eq("winery_id", wineryId)
      .order("sort_order");
    return (data as Wine[]) ?? [];
  } catch {
    return [];
  }
}

export async function getAllRewardTiersAdmin(): Promise<RewardTier[]> {
  if (!isSupabaseConfigured) {
    return [...SEED_REWARD_TIERS].sort((a, b) => a.sort_order - b.sort_order);
  }
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("reward_tiers").select("*").order("sort_order");
    return (data as RewardTier[]) ?? [];
  } catch {
    return [];
  }
}

/** A 4 or 5 star rating counts as "liked" — there's no separate like/dislike field anymore. */
export const LIKED_RATING_THRESHOLD = 4;

export interface WineryLikeStat {
  wineryId: string;
  wineryName: string;
  likedCount: number;
}

export interface WineLikeStat {
  wineId: string;
  wineName: string;
  wineryId: string;
  wineryName: string;
  likedCount: number;
}

export interface WineLikeStats {
  byWinery: WineryLikeStat[];
  topWines: WineLikeStat[];
}

const EMPTY_WINE_LIKE_STATS: WineLikeStats = { byWinery: [], topWines: [] };

export async function getWineLikeStats(): Promise<WineLikeStats> {
  if (!isSupabaseConfigured) return EMPTY_WINE_LIKE_STATS;
  try {
    const supabase = await createClient();
    const [{ data: tastings }, wineries] = await Promise.all([
      supabase
        .from("wine_tastings")
        .select("wines(id, name, winery_id)")
        .gte("rating", LIKED_RATING_THRESHOLD),
      getAllWineriesAdmin(),
    ]);
    if (!tastings) return EMPTY_WINE_LIKE_STATS;

    const wineryNameById = new Map(wineries.map((w) => [w.id, w.name]));
    const wineryLikedCounts = new Map<string, number>();
    const wineStats = new Map<string, WineLikeStat>();

    for (const row of tastings as unknown as {
      wines: { id: string; name: string; winery_id: string } | null;
    }[]) {
      const wine = row.wines;
      if (!wine) continue;

      wineryLikedCounts.set(wine.winery_id, (wineryLikedCounts.get(wine.winery_id) ?? 0) + 1);

      const existing = wineStats.get(wine.id);
      if (existing) {
        existing.likedCount += 1;
      } else {
        wineStats.set(wine.id, {
          wineId: wine.id,
          wineName: wine.name,
          wineryId: wine.winery_id,
          wineryName: wineryNameById.get(wine.winery_id) ?? "Unknown",
          likedCount: 1,
        });
      }
    }

    const byWinery = wineries
      .map((w) => ({
        wineryId: w.id,
        wineryName: w.name,
        likedCount: wineryLikedCounts.get(w.id) ?? 0,
      }))
      .sort((a, b) => b.likedCount - a.likedCount);

    const topWines = Array.from(wineStats.values())
      .sort((a, b) => b.likedCount - a.likedCount)
      .slice(0, 10);

    return { byWinery, topWines };
  } catch {
    return EMPTY_WINE_LIKE_STATS;
  }
}

export interface AppFeedbackEntry {
  rating: number;
  feedback: string;
  created_at: string;
  memberName: string;
  memberEmail: string | null;
}

export interface AppRatingStats {
  average: number;
  count: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
  recentFeedback: AppFeedbackEntry[];
}

const EMPTY_APP_RATING_STATS: AppRatingStats = {
  average: 0,
  count: 0,
  distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  recentFeedback: [],
};

export async function getAppRatingStats(): Promise<AppRatingStats> {
  if (!isSupabaseConfigured) return EMPTY_APP_RATING_STATS;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("app_ratings")
      .select("user_id, rating, feedback, created_at")
      .order("created_at", { ascending: false });
    if (!data || data.length === 0) return EMPTY_APP_RATING_STATS;

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<1 | 2 | 3 | 4 | 5, number>;
    let total = 0;
    for (const row of data) {
      distribution[row.rating as 1 | 2 | 3 | 4 | 5]++;
      total += row.rating;
    }

    const feedbackRows = data
      .filter((r): r is typeof r & { feedback: string } => !!r.feedback)
      .slice(0, 10);

    // app_ratings.user_id references auth.users, not public.profiles, so there's
    // no FK PostgREST can embed through — look member names up separately.
    const userIds = [...new Set(feedbackRows.map((r) => r.user_id))];
    const memberById = new Map<string, { name: string | null; email: string | null }>();
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, email")
        .in("id", userIds);
      (profiles ?? []).forEach((p) => memberById.set(p.id, { name: p.name, email: p.email }));
    }

    const recentFeedback = feedbackRows.map((r) => {
      const member = memberById.get(r.user_id);
      return {
        rating: r.rating,
        feedback: r.feedback,
        created_at: r.created_at,
        memberName: member?.name || member?.email || "Member",
        memberEmail: member?.email ?? null,
      };
    });

    return {
      average: total / data.length,
      count: data.length,
      distribution,
      recentFeedback,
    };
  } catch {
    return EMPTY_APP_RATING_STATS;
  }
}
