"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/admin";
import type { RewardTier } from "@/lib/types";

export interface RewardTierInput {
  label: string;
  points_required: number;
  discount_percent: number;
  sort_order: number;
  active: boolean;
}

export async function createRewardTierAction(input: RewardTierInput): Promise<RewardTier> {
  if (!(await isCurrentUserAdmin())) throw new Error("Not authorized");

  const supabase = await createClient();
  const { data, error } = await supabase.from("reward_tiers").insert(input).select().single();
  if (error) throw new Error(error.message);

  revalidatePath("/admin/rewards");
  revalidatePath("/rewards");
  return data as RewardTier;
}

/** Updates a tier in place — never delete-and-reinsert, since reward_redemptions
 * has a foreign key to reward_tiers and must not be orphaned. */
export async function updateRewardTierAction(id: string, input: RewardTierInput) {
  if (!(await isCurrentUserAdmin())) throw new Error("Not authorized");

  const supabase = await createClient();
  const { error } = await supabase.from("reward_tiers").update(input).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/rewards");
  revalidatePath("/rewards");
}
