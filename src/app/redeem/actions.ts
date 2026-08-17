"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";

/** Marks a redemption code used. Called from the no-login staff redeem page. */
export async function markRedeemedAction(code: string) {
  if (!isSupabaseConfigured) throw new Error("Rewards aren't connected yet");

  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("reward_redemptions")
    .update({ status: "redeemed", redeemed_at: new Date().toISOString() })
    .eq("code", code)
    .eq("status", "issued")
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Code already redeemed or not found");

  revalidatePath(`/redeem/${code}`);
  return data;
}
