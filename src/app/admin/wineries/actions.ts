"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin, getWineryByIdAdmin } from "@/lib/admin";
import { isCurrentUserStaffFor } from "@/lib/portal";
import { feetToMeters } from "@/lib/geo";
import { syncWineryWines, type SyncResult } from "@/lib/wine-sync";
import { syncWineryEvents, type EventSyncResult } from "@/lib/event-sync";

function parseWineryForm(formData: FormData) {
  const benefits = String(formData.get("wine_club_benefits") ?? "")
    .split("\n")
    .map((b) => b.trim())
    .filter(Boolean);

  const radiusFeet = Number(formData.get("checkin_radius_feet") ?? 750);

  return {
    name: String(formData.get("name") ?? "").trim(),
    slug: String(formData.get("slug") ?? "").trim().toLowerCase(),
    city: String(formData.get("city") ?? "").trim(),
    state: String(formData.get("state") ?? "Tennessee").trim(),
    address: String(formData.get("address") ?? "").trim(),
    latitude: Number(formData.get("latitude")),
    longitude: Number(formData.get("longitude")),
    description: String(formData.get("description") ?? "").trim(),
    hero_image: String(formData.get("hero_image") ?? "").trim() || null,
    website_url: String(formData.get("website_url") ?? "").trim() || null,
    wine_club_url: String(formData.get("wine_club_url") ?? "").trim() || null,
    wine_club_title: String(formData.get("wine_club_title") ?? "").trim() || null,
    wine_club_description: String(formData.get("wine_club_description") ?? "").trim() || null,
    wine_club_benefits: benefits,
    hours: String(formData.get("hours") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    instagram_url: String(formData.get("instagram_url") ?? "").trim() || null,
    facebook_url: String(formData.get("facebook_url") ?? "").trim() || null,
    yelp_url: String(formData.get("yelp_url") ?? "").trim() || null,
    checkin_radius_meters: Math.round(feetToMeters(radiusFeet)),
    active: formData.get("active") === "on",
    wine_menu_url: String(formData.get("wine_menu_url") ?? "").trim() || null,
    events_page_url: String(formData.get("events_page_url") ?? "").trim() || null,
  };
}

export type WineryActionResult = { error: string } | void;

export async function createWineryAction(formData: FormData): Promise<WineryActionResult> {
  if (!(await isCurrentUserAdmin())) return { error: "Not authorized" };

  const supabase = await createClient();
  const winery = parseWineryForm(formData);
  const { data, error } = await supabase.from("wineries").insert(winery).select().single();
  if (error) return { error: error.message };

  revalidatePath("/admin/wineries");
  redirect(`/admin/wineries/${data.id}`);
}

export async function updateWineryAction(wineryId: string, formData: FormData): Promise<WineryActionResult> {
  if (!(await isCurrentUserAdmin())) return { error: "Not authorized" };

  const supabase = await createClient();
  const winery = parseWineryForm(formData);
  const { error } = await supabase.from("wineries").update(winery).eq("id", wineryId);
  if (error) return { error: error.message };

  revalidatePath("/admin/wineries");
  revalidatePath(`/admin/wineries/${wineryId}`);
  revalidatePath(`/winery/${winery.slug}`);
}

export interface SeasonalHoursInput {
  label: string;
  start_month: number;
  end_month: number;
  hours_text: string;
}

export async function saveWineryHoursAction(
  wineryId: string,
  rows: SeasonalHoursInput[]
): Promise<WineryActionResult> {
  if (!(await isCurrentUserAdmin()) && !(await isCurrentUserStaffFor(wineryId))) {
    return { error: "Not authorized" };
  }

  const supabase = await createClient();
  const { error: deleteError } = await supabase
    .from("winery_hours")
    .delete()
    .eq("winery_id", wineryId);
  if (deleteError) return { error: deleteError.message };

  const cleaned = rows
    .map((r) => ({ ...r, label: r.label.trim(), hours_text: r.hours_text.trim() }))
    .filter((r) => r.label && r.hours_text);

  if (cleaned.length > 0) {
    const { error: insertError } = await supabase.from("winery_hours").insert(
      cleaned.map((r, i) => ({
        winery_id: wineryId,
        label: r.label,
        start_month: r.start_month,
        end_month: r.end_month,
        hours_text: r.hours_text,
        sort_order: i + 1,
      }))
    );
    if (insertError) return { error: insertError.message };
  }

  revalidatePath(`/admin/wineries/${wineryId}`);
}

export async function setWineSoldOutAction(
  wineId: string,
  wineryId: string,
  soldOut: boolean
): Promise<WineryActionResult> {
  if (!(await isCurrentUserAdmin())) return { error: "Not authorized" };

  const supabase = await createClient();
  const { error } = await supabase.from("wines").update({ sold_out: soldOut }).eq("id", wineId);
  if (error) return { error: error.message };

  const winery = await getWineryByIdAdmin(wineryId);
  revalidatePath(`/admin/wineries/${wineryId}`);
  if (winery) revalidatePath(`/winery/${winery.slug}`);
}

export async function syncWineryNowAction(wineryId: string): Promise<SyncResult> {
  if (!(await isCurrentUserAdmin())) {
    return { wineryId, wineryName: "", added: 0, status: "error", detail: "Not authorized" };
  }

  const winery = await getWineryByIdAdmin(wineryId);
  if (!winery) {
    return { wineryId, wineryName: "", added: 0, status: "error", detail: "Winery not found" };
  }

  try {
    const result = await syncWineryWines(winery);

    const supabase = await createClient();
    const { error: logError } = await supabase.from("wine_sync_log").insert({
      winery_id: winery.id,
      wines_added: result.added,
      status: result.status,
      detail: result.detail ?? null,
    });
    if (logError) console.error("wine_sync_log insert failed:", logError.message);

    revalidatePath(`/admin/wineries/${wineryId}`);
    revalidatePath(`/winery/${winery.slug}`);
    revalidatePath("/my-trail");
    revalidatePath("/");

    return result;
  } catch (err) {
    return {
      wineryId: winery.id,
      wineryName: winery.name,
      added: 0,
      status: "error",
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}

/** Built from the actual request host rather than a hardcoded domain, since
 * Supabase only honors a redirectTo that matches an allowlisted URL in that
 * project's Auth settings — a guessed/wrong domain gets silently dropped in
 * favor of the project's default Site URL. Points straight at
 * /update-password rather than through /auth/callback: Supabase delivers
 * the session as a #access_token= URL fragment (never sent to a server
 * route), so only client-side JS — which the Supabase browser client
 * already does automatically on page load — can pick it up. */
async function portalPasswordRedirect(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "https";
  const origin = host ? `${proto}://${host}` : "https://tennesseewinetrails.com";
  return `${origin}/update-password?next=${encodeURIComponent("/portal")}`;
}

/** Invites a winery contact by email — creates their auth account (Supabase
 * emails them a set-password link) and links their profile to this winery
 * via signup metadata, same pattern as the existing referred_by flow. Fails
 * with "already registered" if this email already has an account — use
 * resendWineryStaffInviteAction for that case instead. */
export async function inviteWineryStaffAction(wineryId: string, email: string): Promise<WineryActionResult> {
  if (!(await isCurrentUserAdmin())) return { error: "Not authorized" };

  const trimmed = email.trim();
  if (!trimmed) return { error: "Email is required" };

  const adminClient = await createAdminClient();
  const { error } = await adminClient.auth.admin.inviteUserByEmail(trimmed, {
    data: { winery_id: wineryId },
    redirectTo: await portalPasswordRedirect(),
  });
  if (error) return { error: error.message };

  revalidatePath(`/admin/wineries/${wineryId}`);
}

/** Re-sends a set-password link to an existing (already-invited) staff
 * account — invite links are one-time-baked, so a stale or unused one can't
 * just be re-clicked, and re-inviting the same email fails with "already
 * registered". This goes through the same public password-recovery flow
 * the "Forgot password" page already uses (works regardless of whether the
 * account ever completed its first sign-in), rather than requiring a
 * separate invite-specific resend API. */
export async function resendWineryStaffInviteAction(wineryId: string, profileId: string): Promise<WineryActionResult> {
  if (!(await isCurrentUserAdmin())) return { error: "Not authorized" };

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", profileId)
    .eq("winery_id", wineryId)
    .maybeSingle();
  if (!profile?.email) return { error: "Could not find that account" };

  const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
    redirectTo: await portalPasswordRedirect(),
  });
  if (error) return { error: error.message };
}

/** Removes portal access without deleting the account — they stay a
 * regular signed-in user, just no longer linked to this winery. */
export async function revokeWineryStaffAction(wineryId: string, profileId: string): Promise<WineryActionResult> {
  if (!(await isCurrentUserAdmin())) return { error: "Not authorized" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ winery_id: null })
    .eq("id", profileId)
    .eq("winery_id", wineryId);
  if (error) return { error: error.message };

  revalidatePath(`/admin/wineries/${wineryId}`);
}

export async function syncEventsNowAction(wineryId: string): Promise<EventSyncResult> {
  if (!(await isCurrentUserAdmin())) {
    return { wineryId, wineryName: "", added: 0, status: "error", detail: "Not authorized" };
  }

  const winery = await getWineryByIdAdmin(wineryId);
  if (!winery) {
    return { wineryId, wineryName: "", added: 0, status: "error", detail: "Winery not found" };
  }

  try {
    const result = await syncWineryEvents(winery);

    const supabase = await createClient();
    const { error: logError } = await supabase.from("event_sync_log").insert({
      winery_id: winery.id,
      events_added: result.added,
      status: result.status,
      detail: result.detail ?? null,
    });
    if (logError) console.error("event_sync_log insert failed:", logError.message);

    revalidatePath(`/admin/wineries/${wineryId}`);
    revalidatePath(`/winery/${winery.slug}`);
    revalidatePath("/");

    return result;
  } catch (err) {
    return {
      wineryId: winery.id,
      wineryName: winery.name,
      added: 0,
      status: "error",
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}
