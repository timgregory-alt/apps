"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isCurrentUserStaffFor } from "@/lib/portal";
import { getWineryByIdAdmin } from "@/lib/admin";
import type { WineStyle } from "@/lib/types";

export type PortalActionResult = { error: string } | void;

export interface WineInput {
  name: string;
  varietal: string;
  style: WineStyle;
  tasting_notes: string;
  food_pairing: string;
  sold_out: boolean;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function cleanInput(input: WineInput) {
  return {
    name: input.name.trim(),
    varietal: input.varietal.trim(),
    style: input.style,
    tasting_notes: input.tasting_notes.trim(),
    food_pairing: input.food_pairing.trim() || null,
    sold_out: input.sold_out,
  };
}

async function revalidateWinery(wineryId: string) {
  revalidatePath("/portal/wines");
  const winery = await getWineryByIdAdmin(wineryId);
  if (winery) revalidatePath(`/winery/${winery.slug}`);
}

export async function createWineAction(wineryId: string, input: WineInput): Promise<PortalActionResult> {
  if (!(await isCurrentUserStaffFor(wineryId))) return { error: "Not authorized" };
  if (!input.name.trim()) return { error: "Wine name is required" };

  const winery = await getWineryByIdAdmin(wineryId);
  if (!winery) return { error: "Winery not found" };

  const supabase = await createClient();
  const { error } = await supabase.from("wines").insert({
    winery_id: wineryId,
    slug: `${winery.slug}-${slugify(input.name)}-${Date.now().toString(36)}`,
    ...cleanInput(input),
  });
  if (error) return { error: error.message };

  await revalidateWinery(wineryId);
}

export async function updateWineAction(
  wineryId: string,
  wineId: string,
  input: WineInput
): Promise<PortalActionResult> {
  if (!(await isCurrentUserStaffFor(wineryId))) return { error: "Not authorized" };
  if (!input.name.trim()) return { error: "Wine name is required" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("wines")
    .update(cleanInput(input))
    .eq("id", wineId)
    .eq("winery_id", wineryId);
  if (error) return { error: error.message };

  await revalidateWinery(wineryId);
}

export async function deleteWineAction(wineryId: string, wineId: string): Promise<PortalActionResult> {
  if (!(await isCurrentUserStaffFor(wineryId))) return { error: "Not authorized" };

  const supabase = await createClient();
  const { error } = await supabase.from("wines").delete().eq("id", wineId).eq("winery_id", wineryId);
  if (error) return { error: error.message };

  await revalidateWinery(wineryId);
}
