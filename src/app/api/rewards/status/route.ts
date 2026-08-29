import { NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  getWineriesWithStatus,
  getWinesWithTastings,
  getProfile,
  getQualifyingReferralCount,
  getUserCheckins,
  getActiveRewardTiers,
} from "@/lib/data";
import { computeRewardsPoints } from "@/lib/rewards";

/** Lightweight, current-points lookup for the signed-in guest — used by
 * GlobalTierCelebration to check for a newly crossed reward tier on every
 * screen, not just the Rewards page itself. */
export async function GET() {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ loggedIn: false });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ loggedIn: false });
  }

  const [wineries, wines, tiers, profile, referralCount, checkins] = await Promise.all([
    getWineriesWithStatus(user.id),
    getWinesWithTastings(user.id),
    getActiveRewardTiers(),
    getProfile(user.id),
    getQualifyingReferralCount(),
    getUserCheckins(user.id),
  ]);

  const points = computeRewardsPoints(
    wineries,
    wines,
    checkins.length,
    referralCount,
    profile?.is_subscriber ?? false
  );
  const ladderTiers = tiers
    .filter((t) => !t.birthday_only)
    .sort((a, b) => a.points_required - b.points_required);

  return NextResponse.json({
    loggedIn: true,
    userId: user.id,
    lifetimeTotal: points.total,
    tiers: ladderTiers,
  });
}
