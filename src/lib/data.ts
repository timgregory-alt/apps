import "server-only";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { FOUNDING_TRAIL, SEED_WINERIES } from "@/lib/seed-data";
import type {
  Checkin,
  CheckinStatus,
  Profile,
  Trail,
  Winery,
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
