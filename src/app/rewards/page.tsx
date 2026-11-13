import Link from "next/link";
import {
  getCurrentUser,
  getProfile,
  getWineriesWithStatus,
  getWinesWithTastings,
  getActiveRewardTiers,
  getUserRewardRedemptions,
  getQualifyingReferralCount,
  getUserCheckins,
} from "@/lib/data";
import {
  computeRewardsPoints,
  currentRewardPeriodKey,
  isBirthdayToday,
  totalPointsSpent,
  POINTS_PER_CHECKIN,
  POINTS_PER_WINE_RATED,
  COMPLETION_BONUS,
  POINTS_PER_REFERRAL,
  SUBSCRIBER_MULTIPLIER,
} from "@/lib/rewards";
import { MIN_WINERIES_FOR_TRAIL_COMPLETION } from "@/lib/trail";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { RewardTierCarousel } from "@/components/rewards/RewardTierCarousel";
import { BirthdayRewardCard } from "@/components/rewards/BirthdayRewardCard";
import { GatedInternalLink } from "@/components/ui/GatedInternalLink";
import { TrailCoverFrame } from "@/components/ui/TrailCoverFrame";

export default async function RewardsPage() {
  const user = await getCurrentUser();

  // Signed-out guests can see what's earnable and browse every reward tier
  // (locked to "X points to go" since balance is 0, same as a brand-new
  // guest) — only the personal stuff (a real balance, redeeming, the
  // birthday reward) needs an account.
  const [wineries, wines, tiers, redemptions, profile, referralCount, checkins] = await Promise.all([
    user ? getWineriesWithStatus(user.id) : Promise.resolve([]),
    user ? getWinesWithTastings(user.id) : Promise.resolve([]),
    getActiveRewardTiers(),
    user ? getUserRewardRedemptions(user.id) : Promise.resolve([]),
    user ? getProfile(user.id) : Promise.resolve(null),
    user ? getQualifyingReferralCount() : Promise.resolve(0),
    user ? getUserCheckins(user.id) : Promise.resolve([]),
  ]);

  const points = computeRewardsPoints(
    wineries,
    wines,
    checkins.length,
    referralCount,
    profile?.is_subscriber ?? false,
    profile?.travel_pass_purchase_count ?? 0
  );
  const balance = points.total - totalPointsSpent(redemptions);
  const ladderTiers = tiers.filter((t) => !t.birthday_only);
  const sortedTiers = [...ladderTiers].sort((a, b) => a.points_required - b.points_required);

  const birthdayTier = tiers.find((t) => t.birthday_only) ?? null;
  const showBirthdayReward =
    !!user && birthdayTier != null && isBirthdayToday(profile?.birth_date ?? null);
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
          <BirthdayRewardCard
            tier={birthdayTier}
            redemption={birthdayRedemption}
            isSubscriber={profile?.is_subscriber ?? false}
          />
        </div>
      )}

      <div className="px-6">
        <Card className="texture-grain relative overflow-hidden bg-[var(--color-burgundy)] p-6 text-[var(--color-ivory)]">
          <TrailCoverFrame />
          {user ? (
            <>
              <p className="relative text-[0.68rem] font-medium uppercase tracking-[0.24em] text-[var(--color-gold-pale)]">
                Points Available to Redeem
              </p>
              <p className="font-serif-display relative mt-1 text-4xl">{balance}</p>
              {balance !== points.total && (
                <p className="relative mt-1 text-xs text-[var(--color-ivory)]/60">
                  {points.total} lifetime points earned
                </p>
              )}
              <div className="relative mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[var(--color-ivory)]/70">
                <span>{points.checkins} check-ins</span>
                <span>{points.winesRated} wines rated</span>
                {points.completionBonus > 0 && <span>Trail completion bonus</span>}
                {points.referrals > 0 && <span>{points.referrals} friends referred</span>}
                {points.travelPassBonus > 0 && <span>Travel Pass bonus</span>}
              </div>
            </>
          ) : (
            <>
              <p className="relative text-[0.68rem] font-medium uppercase tracking-[0.24em] text-[var(--color-gold-pale)]">
                Start Earning
              </p>
              <p className="font-serif-display relative mt-1 text-2xl leading-snug">
                Sign up free to start earning points
              </p>
              <p className="relative mt-2 text-sm text-[var(--color-ivory)]/70">
                Check in at a winery, rate a wine, or complete the trail — see what&rsquo;s earnable
                below.
              </p>
              <Link
                href="/signup"
                className="relative mt-4 inline-flex items-center justify-center rounded-full bg-[var(--color-gold)] px-5 py-2.5 text-sm font-medium text-[var(--color-charcoal)]"
              >
                Create Free Account
              </Link>
            </>
          )}
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
            <li className="flex flex-col gap-0.5 py-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-[var(--color-charcoal)]/80">Complete the full trail</span>
                <span className="text-sm font-medium text-[var(--color-burgundy)]">
                  +{COMPLETION_BONUS} pts
                </span>
              </div>
              <span className="text-xs text-[var(--color-charcoal)]/45">
                Once the trail has {MIN_WINERIES_FOR_TRAIL_COMPLETION}+ wineries
              </span>
            </li>
            <li className="py-2">
              <GatedInternalLink
                href="/profile#referral"
                isLoggedIn={!!user}
                action="view_referral"
                redirectTo="/rewards"
                className="flex items-center justify-between gap-3 -mx-1 rounded-lg px-1 py-0.5 transition-colors hover:bg-black/5"
              >
                <span className="text-sm text-[var(--color-charcoal)]/80 underline decoration-[var(--color-charcoal)]/25 underline-offset-2">
                  Refer a friend who visits
                </span>
                <span className="text-sm font-medium text-[var(--color-burgundy)]">
                  +{POINTS_PER_REFERRAL} pts
                </span>
              </GatedInternalLink>
            </li>
            <li className="py-2 last:pb-0">
              <GatedInternalLink
                href="/profile#premium"
                isLoggedIn={!!user}
                action="view_premium"
                redirectTo="/rewards"
                className="flex items-center justify-between gap-3 -mx-1 rounded-lg px-1 py-0.5 transition-colors hover:bg-black/5"
              >
                <span className="text-sm text-[var(--color-charcoal)]/80 underline decoration-[var(--color-charcoal)]/25 underline-offset-2">
                  {profile?.is_subscriber ? "You're a subscriber" : "Go Premium"}
                </span>
                <span className="text-sm font-medium text-[var(--color-burgundy)]">
                  {SUBSCRIBER_MULTIPLIER}x pts + more
                </span>
              </GatedInternalLink>
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
              balance={balance}
              lifetimeTotal={points.total}
              isSubscriber={profile?.is_subscriber ?? false}
              isLoggedIn={!!user}
            />
          </div>
        )}
      </div>

      <div className="px-6">
        <p className="text-center text-xs text-[var(--color-charcoal)]/45">
          Check in and rate wines on{" "}
          <GatedInternalLink
            href="/my-trail"
            isLoggedIn={!!user}
            action="view_my_trail"
            redirectTo="/rewards"
            className="underline"
          >
            My Trails
          </GatedInternalLink>{" "}
          to start earning.
        </p>
      </div>
    </main>
  );
}
