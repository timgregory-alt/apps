"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/admin";

export type TrailActionResult = { error: string } | void;

/** Creates a new, empty trail — shows up as "Coming soon" on the Explore
 * page automatically (zero wineries mapped) until wineries are dragged
 * onto it from /admin/trails. */
export async function createTrailAction(formData: FormData): Promise<TrailActionResult> {
  if (!(await isCurrentUserAdmin())) return { error: "Not authorized" };

  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase();
  const region = String(formData.get("region") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  if (!name) return { error: "Name is required" };
  if (!slug) return { error: "Slug is required" };
  if (!region) return { error: "Region is required" };

  const supabase = await createClient();
  const { data: maxRow } = await supabase
    .from("trails")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sortOrder = (maxRow?.sort_order ?? 0) + 1;

  const { error } = await supabase.from("trails").insert({ name, slug, region, description, sort_order: sortOrder });
  if (error) return { error: error.message };

  revalidatePath("/admin/trails");
  revalidatePath("/explore");
}

export async function renameTrailAction(trailId: string, name: string): Promise<TrailActionResult> {
  if (!(await isCurrentUserAdmin())) return { error: "Not authorized" };

  const trimmed = name.trim();
  if (!trimmed) return { error: "Name is required" };

  const supabase = await createClient();
  const { error } = await supabase.from("trails").update({ name: trimmed }).eq("id", trailId);
  if (error) return { error: error.message };

  revalidatePath("/admin/trails");
  revalidatePath("/explore");
  revalidatePath("/");
}

/** Updates the trail's hero-card copy — description and region (e.g.
 * "Middle Tennessee") — shown on the homepage and Explore page. */
export async function updateTrailDetailsAction(
  trailId: string,
  details: { description: string | null; region: string }
): Promise<TrailActionResult> {
  if (!(await isCurrentUserAdmin())) return { error: "Not authorized" };

  const region = details.region.trim();
  if (!region) return { error: "Region is required" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("trails")
    .update({ description: details.description?.trim() || null, region })
    .eq("id", trailId);
  if (error) return { error: error.message };

  revalidatePath("/admin/trails");
  revalidatePath("/explore");
  revalidatePath("/");
}

export interface TrailColumnInput {
  /** null is the "Unassigned" pool — those wineries just get removed from
   * trail_wineries entirely rather than inserted anywhere. */
  trailId: string | null;
  wineryIds: string[];
}

/** Resyncs every trail's winery membership and order in one shot after a
 * drag-and-drop change on the admin Trails board. Simpler and safer than
 * diffing which card moved where: delete every trail_wineries row for any
 * winery mentioned anywhere in the submitted layout, then re-insert rows
 * for each non-null column in its given order. The roster is small enough
 * that resyncing the whole board on every drop costs nothing. */
export async function saveTrailLayoutAction(columns: TrailColumnInput[]): Promise<TrailActionResult> {
  if (!(await isCurrentUserAdmin())) return { error: "Not authorized" };

  const allWineryIds = columns.flatMap((c) => c.wineryIds);
  if (allWineryIds.length === 0) return;

  const supabase = await createClient();
  const { error: deleteError } = await supabase.from("trail_wineries").delete().in("winery_id", allWineryIds);
  if (deleteError) return { error: deleteError.message };

  const rows = columns
    .filter((c) => c.trailId !== null)
    .flatMap((c) =>
      c.wineryIds.map((wineryId, index) => ({
        trail_id: c.trailId as string,
        winery_id: wineryId,
        display_order: index,
      }))
    );

  if (rows.length > 0) {
    const { error: insertError } = await supabase.from("trail_wineries").insert(rows);
    if (insertError) return { error: insertError.message };
  }

  revalidatePath("/admin/trails");
  revalidatePath("/explore");
  revalidatePath("/");
}
