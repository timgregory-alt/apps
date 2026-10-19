"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/admin";

export type AdminActionResult = { error: string } | void;

/** Soft-hides a piece of app feedback from the dashboard without deleting
 * it — for feedback that's been read/handled but worth keeping a record
 * of. */
export async function archiveAppFeedbackAction(id: string): Promise<AdminActionResult> {
  if (!(await isCurrentUserAdmin())) return { error: "Not authorized" };

  const supabase = await createClient();
  const { error } = await supabase.from("app_ratings").update({ archived: true }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin");
}

/** Permanently removes a piece of app feedback — for spam or anything that
 * shouldn't be kept around at all. */
export async function deleteAppFeedbackAction(id: string): Promise<AdminActionResult> {
  if (!(await isCurrentUserAdmin())) return { error: "Not authorized" };

  const supabase = await createClient();
  const { error } = await supabase.from("app_ratings").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin");
}

/** Soft-hides a piece of winery feedback from the dashboard without
 * deleting it. */
export async function archiveWineryFeedbackAction(id: string): Promise<AdminActionResult> {
  if (!(await isCurrentUserAdmin())) return { error: "Not authorized" };

  const supabase = await createClient();
  const { error } = await supabase.from("winery_feedback").update({ archived: true }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin");
}

/** Permanently removes a piece of winery feedback. */
export async function deleteWineryFeedbackAction(id: string): Promise<AdminActionResult> {
  if (!(await isCurrentUserAdmin())) return { error: "Not authorized" };

  const supabase = await createClient();
  const { error } = await supabase.from("winery_feedback").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin");
}
