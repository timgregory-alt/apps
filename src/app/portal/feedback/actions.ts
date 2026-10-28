"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getWineryStaffContext } from "@/lib/portal";

export async function submitWineryFeedbackAction(feedback: string): Promise<{ error: string } | void> {
  const trimmed = feedback.trim();
  if (!trimmed) return { error: "Feedback can't be empty." };

  const ctx = await getWineryStaffContext();
  if (!ctx) return { error: "Sign in to a winery account to send feedback." };

  const supabase = await createClient();
  const { error } = await supabase.from("winery_feedback").insert({
    winery_id: ctx.winery.id,
    submitted_by: ctx.userId,
    feedback: trimmed,
  });
  if (error) return { error: error.message };

  revalidatePath("/portal");
}
