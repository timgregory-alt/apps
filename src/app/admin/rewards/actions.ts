"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/admin";
import type { RewardTier } from "@/lib/types";

export interface RewardTierInput {
  label: string;
  points_required: number;
  discount_percent: number;
  subscriber_discount_percent: number | null;
  choice_options: string[] | null;
  birthday_only: boolean;
  sort_order: number;
  active: boolean;
}

export async function createRewardTierAction(
  input: RewardTierInput
): Promise<RewardTier | { error: string }> {
  if (!(await isCurrentUserAdmin())) return { error: "Not authorized" };

  const supabase = await createClient();
  const { data, error } = await supabase.from("reward_tiers").insert(input).select().single();
  if (error) return { error: error.message };

  revalidatePath("/admin/rewards");
  revalidatePath("/rewards");
  return data as RewardTier;
}

/** Updates a tier in place — never delete-and-reinsert, since reward_redemptions
 * has a foreign key to reward_tiers and must not be orphaned. */
export async function updateRewardTierAction(
  id: string,
  input: RewardTierInput
): Promise<{ error: string } | void> {
  if (!(await isCurrentUserAdmin())) return { error: "Not authorized" };

  const supabase = await createClient();
  const { error } = await supabase.from("reward_tiers").update(input).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/rewards");
  revalidatePath("/rewards");
}

/** Wipes the signed-in admin's own check-ins, wine ratings, trail
 * completion, and reward redemptions — the activity points are derived
 * from — so their account tests from a clean 0-points, no-tier state.
 * Points are never stored directly, so there's nothing to "set to 0"
 * except the underlying activity rows. Checkins/ratings/completions have
 * no delete policy for regular users (they're meant to be immutable), so
 * this goes through the service-role client and is admin-only. Only ever
 * touches the caller's own account — there's no userId parameter. */
export async function resetMyRewardsTestDataAction(): Promise<{ error: string } | { success: true }> {
  if (!(await isCurrentUserAdmin())) return { error: "Not authorized" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const adminClient = await createAdminClient();
  const results = await Promise.all([
    adminClient.from("checkins").delete().eq("user_id", user.id),
    adminClient.from("wine_tastings").delete().eq("user_id", user.id),
    adminClient.from("custom_wine_tastings").delete().eq("user_id", user.id),
    adminClient.from("trail_completions").delete().eq("user_id", user.id),
    adminClient.from("reward_redemptions").delete().eq("user_id", user.id),
  ]);
  const failed = results.find((r) => r.error);
  if (failed?.error) return { error: failed.error.message };

  revalidatePath("/rewards");
  revalidatePath("/my-trail");
  revalidatePath("/admin/rewards");
  revalidatePath("/profile");
  return { success: true };
}
