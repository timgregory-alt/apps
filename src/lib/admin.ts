import "server-only";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { SEED_WINERIES, SEED_WINES } from "@/lib/seed-data";
import type { Winery, Wine } from "@/lib/types";

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
