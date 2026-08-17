import Link from "next/link";
import {
  getCurrentUser,
  getWineriesWithStatus,
  getWinesWithTastings,
  getActiveRewardTiers,
  getUserRewardRedemptions,
} from "@/lib/data";
import { computeRewardsPoints } from "@/lib/rewards";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { RewardTierCard } from "@/components/rewards/RewardTierCard";

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

  const [wineries, wines, tiers, redemptions] = await Promise.all([
    getWineriesWithStatus(user.id),
    getWinesWithTastings(user.id),
    getActiveRewardTiers(),
    getUserRewardRedemptions(user.id),
  ]);

  const points = computeRewardsPoints(wineries, wines);
  const redemptionByTier = new Map(redemptions.map((r) => [r.tier_id, r]));
  const sortedTiers = [...tiers].sort((a, b) => a.points_required - b.points_required);

  return (
    <main className="mx-auto flex max-w-md flex-col gap-8 pb-10">
      <Header eyebrow="Rewards" title="Your Rewards" />

      <div className="px-6">
        <Card className="texture-grain bg-[var(--color-burgundy)] p-6 text-[var(--color-ivory)]">
          <p className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-[var(--color-gold-pale)]">
            Total Points
          </p>
          <p className="font-serif-display mt-1 text-4xl">{points.total}</p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[var(--color-ivory)]/70">
            <span>{points.checkins} check-ins</span>
            <span>{points.winesRated} wines rated</span>
            {points.completionBonus > 0 && <span>Trail completion bonus</span>}
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-3 px-6">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-charcoal)]/45">
          Rewards
        </p>
        {sortedTiers.length === 0 ? (
          <Card className="p-6 text-center text-sm text-[var(--color-charcoal)]/55">
            No rewards available yet — check back soon.
          </Card>
        ) : (
          sortedTiers.map((tier) => (
            <RewardTierCard
              key={tier.id}
              tier={tier}
              pointsTotal={points.total}
              redemption={redemptionByTier.get(tier.id) ?? null}
            />
          ))
        )}
      </div>

      <div className="px-6">
        <p className="text-center text-xs text-[var(--color-charcoal)]/45">
          Earn points by checking in at wineries, rating wines on your{" "}
          <Link href="/passport" className="underline">
            passport
          </Link>
          , and completing the full trail.
        </p>
      </div>
    </main>
  );
}
