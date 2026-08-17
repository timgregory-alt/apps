"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveRewardTiers, getWineriesWithStatus, getWinesWithTastings } from "@/lib/data";
import { computeRewardsPoints, generateRedemptionCode } from "@/lib/rewards";
import type { RewardRedemption } from "@/lib/types";

/** Issues (or returns the already-issued) redemption code for a tier the user has unlocked.
 * chosenOption is required for tiers with choice_options (e.g. Sommelier's Choice). */
export async function generateRedemptionAction(
  tierId: string,
  chosenOption?: string
): Promise<RewardRedemption> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in to redeem a reward");

  const { data: existing } = await supabase
    .from("reward_redemptions")
    .select("*")
    .eq("user_id", user.id)
    .eq("tier_id", tierId)
    .maybeSingle();
  if (existing) return existing as RewardRedemption;

  const [tiers, wineries, wines] = await Promise.all([
    getActiveRewardTiers(),
    getWineriesWithStatus(user.id),
    getWinesWithTastings(user.id),
  ]);
  const tier = tiers.find((t) => t.id === tierId);
  if (!tier) throw new Error("Reward tier not found");

  const points = computeRewardsPoints(wineries, wines);
  if (points.total < tier.points_required) throw new Error("Not enough points yet");

  if (tier.choice_options && tier.choice_options.length > 0) {
    if (!chosenOption || !tier.choice_options.includes(chosenOption)) {
      throw new Error("Choose a reward first");
    }
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateRedemptionCode();
    const { data, error } = await supabase
      .from("reward_redemptions")
      .insert({ user_id: user.id, tier_id: tierId, code, chosen_option: chosenOption ?? null })
      .select()
      .single();
    if (data) {
      revalidatePath("/rewards");
      return data as RewardRedemption;
    }
    if (error?.code !== "23505") throw new Error(error?.message ?? "Could not redeem");
  }
  throw new Error("Could not generate a unique code — please try again");
}
