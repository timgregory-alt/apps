"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/admin";

export type LinkActionResult = { error: string } | void;

function slugify(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createTrackedLinkAction(formData: FormData): Promise<LinkActionResult> {
  if (!(await isCurrentUserAdmin())) return { error: "Not authorized" };

  const label = String(formData.get("label") ?? "").trim();
  const destinationUrl = String(formData.get("destination_url") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? "") || label);

  if (!label || !destinationUrl || !slug) {
    return { error: "Label, destination URL, and slug are all required" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("tracked_links").insert({ slug, label, destination_url: destinationUrl });
  if (error) return { error: error.code === "23505" ? "That slug is already in use" : error.message };

  revalidatePath("/admin/links");
}

export async function deleteTrackedLinkAction(id: string): Promise<LinkActionResult> {
  if (!(await isCurrentUserAdmin())) return { error: "Not authorized" };

  const supabase = await createClient();
  const { error } = await supabase.from("tracked_links").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/links");
}
