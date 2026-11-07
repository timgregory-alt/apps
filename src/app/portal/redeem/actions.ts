"use server";

import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getWineryStaffContext } from "@/lib/portal";
import { discountLabel, effectiveDiscountPercent } from "@/lib/rewards";
import type { RewardTier } from "@/lib/types";

export interface VerifyRedemptionResult {
  error?: string;
  code?: string;
  tierLabel?: string;
  discountText?: string;
  alreadyVerified?: boolean;
  verifiedAt?: string;
  verifiedAtWineryName?: string | null;
}

/** Looks up a guest's redemption code and, the first time it's checked,
 * marks it verified — this is the actual "honor this discount" moment, kept
 * separate from redeemed_at (set client-side the instant the guest reveals
 * the code, before anyone at a register has seen it). A second lookup of
 * the same code reports it as already verified instead of approving it
 * again, so a screenshot of the QR code can't be reused. Requires a signed-in
 * winery-portal account — any winery's staff can verify any code, since the
 * reward is trail-wide, not tied to one winery. */
export async function verifyRedemptionCodeAction(rawCode: string): Promise<VerifyRedemptionResult> {
  if (!isSupabaseConfigured) return { error: "Not configured" };

  const ctx = await getWineryStaffContext();
  if (!ctx) return { error: "Not authorized" };

  const code = rawCode.trim().toUpperCase();
  if (!code) return { error: "Enter or scan a code" };

  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("reward_redemptions")
    .select("*, reward_tiers(*)")
    .eq("code", code)
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data) return { error: "Code not found" };

  const tier = (data.reward_tiers ?? null) as RewardTier | null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_subscriber")
    .eq("id", data.user_id)
    .maybeSingle();
  const percent = tier ? effectiveDiscountPercent(tier, profile?.is_subscriber ?? false) : 0;
  const discountText = data.chosen_option ?? (tier ? discountLabel(percent) : "");

  async function wineryName(wineryId: string | null): Promise<string | null> {
    if (!wineryId) return null;
    const { data: winery } = await supabase.from("wineries").select("name").eq("id", wineryId).maybeSingle();
    return winery?.name ?? null;
  }

  if (data.verified_at) {
    return {
      code,
      tierLabel: tier?.label,
      discountText,
      alreadyVerified: true,
      verifiedAt: data.verified_at,
      verifiedAtWineryName: await wineryName(data.verified_by_winery_id),
    };
  }

  const now = new Date().toISOString();
  const { data: updated, error: updateError } = await supabase
    .from("reward_redemptions")
    .update({ verified_at: now, verified_by_winery_id: ctx.winery.id })
    .eq("id", data.id)
    .is("verified_at", null)
    .select()
    .maybeSingle();
  if (updateError) return { error: updateError.message };

  if (updated) {
    return { code, tierLabel: tier?.label, discountText, alreadyVerified: false, verifiedAt: now };
  }

  // Someone else verified it between our select and this update — re-fetch
  // to report the actual original time/winery, not our own attempt.
  const { data: current } = await supabase
    .from("reward_redemptions")
    .select("verified_at, verified_by_winery_id")
    .eq("id", data.id)
    .maybeSingle();
  return {
    code,
    tierLabel: tier?.label,
    discountText,
    alreadyVerified: true,
    verifiedAt: current?.verified_at ?? now,
    verifiedAtWineryName: await wineryName(current?.verified_by_winery_id ?? null),
  };
}
