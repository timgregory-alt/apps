"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  getActiveRewardTiers,
  getProfile,
  getWineriesWithStatus,
  getWinesWithTastings,
  getQualifyingReferralCount,
  getUserCheckins,
  getUserRewardRedemptions,
} from "@/lib/data";
import {
  computeRewardsPoints,
  currentRewardPeriodKey,
  generateRedemptionCode,
  isBirthdayToday,
  totalPointsSpent,
} from "@/lib/rewards";
import type { RewardRedemption } from "@/lib/types";

/** Issues a redemption code for a tier the guest can currently afford, spending
 * that tier's points out of their spendable balance (lifetime points minus
 * points already spent). The code is marked redeemed immediately — showing
 * it at the register *is* the redemption, there's no separate staff
 * confirmation step. Reaching a tier's threshold is a permanent status —
 * once lifetime points cross it, the guest can redeem it again and again as
 * they earn the points back, same as an airline miles balance. chosenOption
 * is required for tiers with choice_options (e.g. Sommelier's Choice).
 * birthday_only tiers are free (0 points) and gated by today's date, capped
 * to one per calendar year via period_key. The client is expected to confirm
 * with the guest before calling this — it spends points/claims the year's
 * birthday reward the instant it succeeds, with no undo. */
export async function generateRedemptionAction(
  tierId: string,
  chosenOption?: string
): Promise<RewardRedemption | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to redeem a reward" };

  const [tiers, wineries, wines, profile, referralCount, checkins, redemptions] = await Promise.all([
    getActiveRewardTiers(),
    getWineriesWithStatus(user.id),
    getWinesWithTastings(user.id),
    getProfile(user.id),
    getQualifyingReferralCount(),
    getUserCheckins(user.id),
    getUserRewardRedemptions(user.id),
  ]);
  const tier = tiers.find((t) => t.id === tierId);
  if (!tier) return { error: "Reward tier not found" };

  const periodKey = tier.birthday_only ? currentRewardPeriodKey() : "";
  let pointsSpent = 0;

  if (tier.birthday_only) {
    // Once per calendar year.
    const alreadyThisYear = redemptions.find(
      (r) => r.tier_id === tierId && r.period_key === periodKey
    );
    if (alreadyThisYear) return alreadyThisYear;

    if (!isBirthdayToday(profile?.birth_date ?? null)) {
      return { error: "This reward only unlocks on your birthday" };
    }
  } else {
    const points = computeRewardsPoints(
      wineries,
      wines,
      checkins.length,
      referralCount,
      profile?.is_subscriber ?? false
    );
    const balance = points.total - totalPointsSpent(redemptions);
    if (balance < tier.points_required) return { error: "Not enough points to redeem right now" };
    pointsSpent = tier.points_required;
  }

  if (tier.choice_options && tier.choice_options.length > 0) {
    if (!chosenOption || !tier.choice_options.includes(chosenOption)) {
      return { error: "Choose a reward first" };
    }
  }

  const now = new Date().toISOString();
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateRedemptionCode();
    const { data, error } = await supabase
      .from("reward_redemptions")
      .insert({
        user_id: user.id,
        tier_id: tierId,
        code,
        period_key: periodKey,
        chosen_option: chosenOption ?? null,
        points_spent: pointsSpent,
        status: "redeemed",
        redeemed_at: now,
      })
      .select()
      .single();
    if (data) {
      revalidatePath("/rewards");
      return data as RewardRedemption;
    }
    if (error?.code !== "23505") return { error: error?.message ?? "Could not redeem" };
  }
  return { error: "Could not generate a unique code — please try again" };
}
