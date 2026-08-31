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

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/** Uploads a winery photo to Storage and returns its public URL — used by
 * ImageUploadField instead of requiring a hand-pasted URL, which turned out
 * to sometimes be a Facebook CDN hotlink (unreliable across devices/
 * sessions) or a HEIC file (unsupported outside Safari). Not tied to a
 * specific winery id, so it works the same for a brand-new winery that
 * hasn't been saved yet as for editing an existing one. */
export async function uploadWineryPhotoAction(formData: FormData): Promise<{ error: string } | { url: string }> {
  if (!(await isCurrentUserAdmin())) return { error: "Not authorized" };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a photo to upload" };

  const ext = ALLOWED_PHOTO_TYPES[file.type];
  if (!ext) return { error: "Please upload a JPEG, PNG, WebP, or GIF image (not HEIC or other formats)" };
  if (file.size > MAX_PHOTO_BYTES) return { error: "Photo is too large (max 8MB)" };

  const path = `wineries/${crypto.randomUUID()}.${ext}`;
  const supabase = await createClient();
  const { error } = await supabase.storage
    .from("winery-photos")
    .upload(path, file, { contentType: file.type, cacheControl: "31536000" });
  if (error) return { error: error.message };

  const { data } = supabase.storage.from("winery-photos").getPublicUrl(path);
  return { url: data.publicUrl };
}

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

/** Grants portal access for a winery contact by email. If that email
 * already has an account — a guest who'd signed up before, or a staff
 * account for another winery — Supabase's invite API just fails outright
 * with "already registered" and never links anything, which silently drops
 * the request. So this checks for an existing profile first and links it
 * directly (no invite email needed — they already have credentials to sign
 * in with); only a genuinely new email goes through the invite-by-email
 * flow that creates a brand new account. */
export async function inviteWineryStaffAction(wineryId: string, email: string): Promise<WineryActionResult> {
  if (!(await isCurrentUserAdmin())) return { error: "Not authorized" };

  const trimmed = email.trim();
  if (!trimmed) return { error: "Email is required" };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .ilike("email", trimmed)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("profiles").update({ winery_id: wineryId }).eq("id", existing.id);
    if (error) return { error: error.message };
    revalidatePath(`/admin/wineries/${wineryId}`);
    return;
  }

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

/** Removes a winery from the guest-facing app without deleting anything —
 * marks it inactive, same flag the "Active" checkbox in the winery edit
 * form already controls. Check-ins reference wineries with ON DELETE
 * CASCADE, so an actual delete would also erase every guest's visit
 * history, ratings, and click data tied to it; deactivating instead hides
 * it from Explore/check-in/the trail while keeping that history intact and
 * lets it be restored later. */
export async function removeWineryAction(wineryId: string): Promise<WineryActionResult> {
  if (!(await isCurrentUserAdmin())) return { error: "Not authorized" };

  const supabase = await createClient();
  const { error } = await supabase.from("wineries").update({ active: false }).eq("id", wineryId);
  if (error) return { error: error.message };

  const winery = await getWineryByIdAdmin(wineryId);
  revalidatePath("/admin/wineries");
  revalidatePath(`/admin/wineries/${wineryId}`);
  revalidatePath("/");
  revalidatePath("/my-trail");
  if (winery) revalidatePath(`/winery/${winery.slug}`);
}

/** Restores a previously-removed winery back into the guest-facing app. */
export async function restoreWineryAction(wineryId: string): Promise<WineryActionResult> {
  if (!(await isCurrentUserAdmin())) return { error: "Not authorized" };

  const supabase = await createClient();
  const { error } = await supabase.from("wineries").update({ active: true }).eq("id", wineryId);
  if (error) return { error: error.message };

  const winery = await getWineryByIdAdmin(wineryId);
  revalidatePath("/admin/wineries");
  revalidatePath(`/admin/wineries/${wineryId}`);
  revalidatePath("/");
  revalidatePath("/my-trail");
  if (winery) revalidatePath(`/winery/${winery.slug}`);
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
