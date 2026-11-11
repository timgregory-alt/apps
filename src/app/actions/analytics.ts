"use server";

import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";

/** Best-effort ping for a signed-out visitor attempting a gated action
 * (check-in, rating a wine, saving notes, adding a custom wine) — fired
 * right before redirecting them to /login. Distinguishes "browsed and
 * left" from "tried to do something and hit the wall," which a raw page-
 * view count can't. Uses the admin client since this is an anonymous
 * analytics ping with no RLS-relevant user context. */
export async function logGatedActionAttemptAction(
  action: string,
  wineryId: string | null = null
): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const supabase = await createAdminClient();
    const { error } = await supabase
      .from("gated_action_attempts")
      .insert({ action, winery_id: wineryId });
    if (error) console.error("logGatedActionAttemptAction insert failed:", error.message);
  } catch (err) {
    console.error("logGatedActionAttemptAction threw:", err);
  }
}
