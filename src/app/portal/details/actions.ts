"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isCurrentUserStaffFor } from "@/lib/portal";
import { getWineryByIdAdmin } from "@/lib/admin";

export type PortalActionResult = { error: string } | void;

/** Fields a winery's own staff may edit about their listing — deliberately
 * excludes name/slug/address/coordinates/checkin radius/active/sort order/
 * sponsored/featured, which stay admin-only (identity, anti-fraud, and
 * platform monetization controls). */
function parseDetailsForm(formData: FormData) {
  const benefits = String(formData.get("wine_club_benefits") ?? "")
    .split("\n")
    .map((b) => b.trim())
    .filter(Boolean);

  return {
    description: String(formData.get("description") ?? "").trim(),
    hours: String(formData.get("hours") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    instagram_url: String(formData.get("instagram_url") ?? "").trim() || null,
    facebook_url: String(formData.get("facebook_url") ?? "").trim() || null,
    yelp_url: String(formData.get("yelp_url") ?? "").trim() || null,
    website_url: String(formData.get("website_url") ?? "").trim() || null,
    wine_menu_url: String(formData.get("wine_menu_url") ?? "").trim() || null,
    events_page_url: String(formData.get("events_page_url") ?? "").trim() || null,
    wine_club_url: String(formData.get("wine_club_url") ?? "").trim() || null,
    wine_club_title: String(formData.get("wine_club_title") ?? "").trim() || null,
    wine_club_description: String(formData.get("wine_club_description") ?? "").trim() || null,
    wine_club_benefits: benefits,
  };
}

export async function updateWineryDetailsAsStaffAction(
  wineryId: string,
  formData: FormData
): Promise<PortalActionResult> {
  if (!(await isCurrentUserStaffFor(wineryId))) return { error: "Not authorized" };

  const supabase = await createClient();
  const { error } = await supabase.from("wineries").update(parseDetailsForm(formData)).eq("id", wineryId);
  if (error) return { error: error.message };

  const winery = await getWineryByIdAdmin(wineryId);
  revalidatePath("/portal/details");
  if (winery) revalidatePath(`/winery/${winery.slug}`);
}
