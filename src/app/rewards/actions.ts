"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  getActiveRewardTiers,
  getProfile,
  getWineriesWithStatus,
  getWinesWithTastings,
  getQualifyingReferralCount,
} from "@/lib/data";
import {
  computeRewardsPoints,
  currentRewardPeriodKey,
  generateRedemptionCode,
  isBirthdayToday,
} from "@/lib/rewards";
import type { RewardRedemption } from "@/lib/types";

/** Issues (or returns the already-issued) redemption code for a tier the user has unlocked.
 * chosenOption is required for tiers with choice_options (e.g. Sommelier's Choice).
 * birthday_only tiers are gated by today's date instead of points, and use a
 * per-year period_key so the same tier can be redeemed again next birthday. */
export async function generateRedemptionAction(
  tierId: string,
  chosenOption?: string
): Promise<RewardRedemption> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in to redeem a reward");

  const [tiers, wineries, wines, profile, referralCount] = await Promise.all([
    getActiveRewardTiers(),
    getWineriesWithStatus(user.id),
    getWinesWithTastings(user.id),
    getProfile(user.id),
    getQualifyingReferralCount(),
  ]);
  const tier = tiers.find((t) => t.id === tierId);
  if (!tier) throw new Error("Reward tier not found");

  const periodKey = tier.birthday_only ? currentRewardPeriodKey() : "";

  const { data: existing } = await supabase
    .from("reward_redemptions")
    .select("*")
    .eq("user_id", user.id)
    .eq("tier_id", tierId)
    .eq("period_key", periodKey)
    .maybeSingle();
  if (existing) return existing as RewardRedemption;

  if (tier.birthday_only) {
    if (!isBirthdayToday(profile?.birth_date ?? null)) {
      throw new Error("This reward only unlocks on your birthday");
    }
  } else {
    const points = computeRewardsPoints(wineries, wines, referralCount);
    if (points.total < tier.points_required) throw new Error("Not enough points yet");
  }

  if (tier.choice_options && tier.choice_options.length > 0) {
    if (!chosenOption || !tier.choice_options.includes(chosenOption)) {
      throw new Error("Choose a reward first");
    }
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateRedemptionCode();
    const { data, error } = await supabase
      .from("reward_redemptions")
      .insert({ user_id: user.id, tier_id: tierId, code, period_key: periodKey, chosen_option: chosenOption ?? null })
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
