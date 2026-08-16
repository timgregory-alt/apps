"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/admin";
import { feetToMeters } from "@/lib/geo";

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
    checkin_radius_meters: Math.round(feetToMeters(radiusFeet)),
    active: formData.get("active") === "on",
  };
}

export async function createWineryAction(formData: FormData) {
  if (!(await isCurrentUserAdmin())) throw new Error("Not authorized");

  const supabase = await createClient();
  const winery = parseWineryForm(formData);
  const { data, error } = await supabase.from("wineries").insert(winery).select().single();
  if (error) throw new Error(error.message);

  revalidatePath("/admin/wineries");
  redirect(`/admin/wineries/${data.id}`);
}

export async function updateWineryAction(wineryId: string, formData: FormData) {
  if (!(await isCurrentUserAdmin())) throw new Error("Not authorized");

  const supabase = await createClient();
  const winery = parseWineryForm(formData);
  const { error } = await supabase.from("wineries").update(winery).eq("id", wineryId);
  if (error) throw new Error(error.message);

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

export async function saveWineryHoursAction(wineryId: string, rows: SeasonalHoursInput[]) {
  if (!(await isCurrentUserAdmin())) throw new Error("Not authorized");

  const supabase = await createClient();
  const { error: deleteError } = await supabase
    .from("winery_hours")
    .delete()
    .eq("winery_id", wineryId);
  if (deleteError) throw new Error(deleteError.message);

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
    if (insertError) throw new Error(insertError.message);
  }

  revalidatePath(`/admin/wineries/${wineryId}`);
}
