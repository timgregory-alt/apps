"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { RewardRedemption } from "@/lib/types";

/** Marks a redemption code used. Called from the no-login staff redeem page. */
export async function markRedeemedAction(
  code: string
): Promise<RewardRedemption | { error: string }> {
  if (!isSupabaseConfigured) return { error: "Rewards aren't connected yet" };

  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("reward_redemptions")
    .update({ status: "redeemed", redeemed_at: new Date().toISOString() })
    .eq("code", code)
    .eq("status", "issued")
    .select()
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data) return { error: "Code already redeemed or not found" };

  revalidatePath(`/redeem/${code}`);
  return data as RewardRedemption;
}
