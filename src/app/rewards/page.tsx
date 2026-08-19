import Link from "next/link";
import {
  getCurrentUser,
  getProfile,
  getWineriesWithStatus,
  getWinesWithTastings,
  getActiveRewardTiers,
  getUserRewardRedemptions,
  getQualifyingReferralCount,
} from "@/lib/data";
import {
  computeRewardsPoints,
  currentRewardPeriodKey,
  isBirthdayToday,
  POINTS_PER_CHECKIN,
  POINTS_PER_WINE_RATED,
  COMPLETION_BONUS,
  POINTS_PER_REFERRAL,
  SUBSCRIBER_MULTIPLIER,
} from "@/lib/rewards";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { RewardTierCarousel } from "@/components/rewards/RewardTierCarousel";
import { BirthdayRewardCard } from "@/components/rewards/BirthdayRewardCard";
import { TrailCoverFrame } from "@/components/ui/TrailCoverFrame";

export default async function RewardsPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <main className="mx-auto flex max-w-md flex-col gap-8 pb-10">
        <Header eyebrow="Rewards" title="Your Rewards" />
        <div className="px-6">
          <Card className="flex flex-col items-center gap-3 p-6 text-center">
            <p className="text-sm text-[var(--color-charcoal)]/70">
              Sign in to start earning points for check-ins, wine ratings, and completing the trail.
            </p>
            <LinkButton href="/login" size="sm">
              Sign In
            </LinkButton>
          </Card>
        </div>
      </main>
    );
  }

  const [wineries, wines, tiers, redemptions, profile, referralCount] = await Promise.all([
    getWineriesWithStatus(user.id),
    getWinesWithTastings(user.id),
    getActiveRewardTiers(),
    getUserRewardRedemptions(user.id),
    getProfile(user.id),
    getQualifyingReferralCount(),
  ]);

  const points = computeRewardsPoints(wineries, wines, referralCount, profile?.is_subscriber ?? false);
  const ladderTiers = tiers.filter((t) => !t.birthday_only);
  const redemptionByTier = new Map(
    redemptions.filter((r) => r.period_key === "").map((r) => [r.tier_id, r])
  );
  const sortedTiers = [...ladderTiers].sort((a, b) => a.points_required - b.points_required);

  const birthdayTier = tiers.find((t) => t.birthday_only) ?? null;
  const showBirthdayReward = birthdayTier != null && isBirthdayToday(profile?.birth_date ?? null);
  const birthdayRedemption = birthdayTier
    ? (redemptions.find(
        (r) => r.tier_id === birthdayTier.id && r.period_key === currentRewardPeriodKey()
      ) ?? null)
    : null;

  return (
    <main className="mx-auto flex max-w-md flex-col gap-8 pb-10">
      <Header eyebrow="Rewards" title="Your Rewards" />

      {showBirthdayReward && birthdayTier && (
        <div className="px-6">
          <BirthdayRewardCard tier={birthdayTier} redemption={birthdayRedemption} />
        </div>
      )}

      <div className="px-6">
        <Card className="texture-grain relative overflow-hidden bg-[var(--color-burgundy)] p-6 text-[var(--color-ivory)]">
          <TrailCoverFrame />
          <p className="relative text-[0.68rem] font-medium uppercase tracking-[0.24em] text-[var(--color-gold-pale)]">
            Total Points
          </p>
          <p className="font-serif-display relative mt-1 text-4xl">{points.total}</p>
          <div className="relative mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[var(--color-ivory)]/70">
            <span>{points.checkins} check-ins</span>
            <span>{points.winesRated} wines rated</span>
            {points.completionBonus > 0 && <span>Trail completion bonus</span>}
            {points.referrals > 0 && <span>{points.referrals} friends referred</span>}
          </div>
        </Card>
      </div>

      <div className="px-6">
        <Card className="flex flex-col gap-3 p-5">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-charcoal)]/45">
            How to Earn Points
          </p>
          <ul className="flex flex-col divide-y divide-[var(--color-line)]">
            <li className="flex items-center justify-between gap-3 py-2 first:pt-0">
              <span className="text-sm text-[var(--color-charcoal)]/80">Check in at a winery</span>
              <span className="text-sm font-medium text-[var(--color-burgundy)]">
                +{POINTS_PER_CHECKIN} pts
              </span>
            </li>
            <li className="flex items-center justify-between gap-3 py-2">
              <span className="text-sm text-[var(--color-charcoal)]/80">Rate a wine</span>
              <span className="text-sm font-medium text-[var(--color-burgundy)]">
                +{POINTS_PER_WINE_RATED} pts
              </span>
            </li>
            <li className="flex items-center justify-between gap-3 py-2">
              <span className="text-sm text-[var(--color-charcoal)]/80">Complete the full trail</span>
              <span className="text-sm font-medium text-[var(--color-burgundy)]">
                +{COMPLETION_BONUS} pts
              </span>
            </li>
            <li className="py-2">
              <Link
                href="/profile#referral"
                className="flex items-center justify-between gap-3 -mx-1 rounded-lg px-1 py-0.5 transition-colors hover:bg-black/5"
              >
                <span className="text-sm text-[var(--color-charcoal)]/80 underline decoration-[var(--color-charcoal)]/25 underline-offset-2">
                  Refer a friend who visits
                </span>
                <span className="text-sm font-medium text-[var(--color-burgundy)]">
                  +{POINTS_PER_REFERRAL} pts
                </span>
              </Link>
            </li>
            <li className="py-2 last:pb-0">
              <Link
                href="/profile#premium"
                className="flex items-center justify-between gap-3 -mx-1 rounded-lg px-1 py-0.5 transition-colors hover:bg-black/5"
              >
                <span className="text-sm text-[var(--color-charcoal)]/80 underline decoration-[var(--color-charcoal)]/25 underline-offset-2">
                  {profile?.is_subscriber ? "You're a subscriber" : "Go Premium"}
                </span>
                <span className="text-sm font-medium text-[var(--color-burgundy)]">
                  {SUBSCRIBER_MULTIPLIER}x pts
                </span>
              </Link>
            </li>
          </ul>
        </Card>
      </div>

      <div className="flex flex-col gap-3">
        <p className="px-6 text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-charcoal)]/45">
          Rewards
        </p>
        {sortedTiers.length === 0 ? (
          <div className="px-6">
            <Card className="p-6 text-center text-sm text-[var(--color-charcoal)]/55">
              No rewards available yet — check back soon.
            </Card>
          </div>
        ) : (
          <div className="px-6">
            <RewardTierCarousel
              tiers={sortedTiers}
              pointsTotal={points.total}
              redemptionByTier={redemptionByTier}
            />
          </div>
        )}
      </div>

      <div className="px-6">
        <p className="text-center text-xs text-[var(--color-charcoal)]/45">
          Check in and rate wines on{" "}
          <Link href="/my-trail" className="underline">
            My Trail
          </Link>{" "}
          to start earning.
        </p>
      </div>
    </main>
  );
}
