import { getAllRewardTiersAdmin } from "@/lib/admin";
import { RewardTiersAdmin } from "@/components/admin/RewardTiersAdmin";

export default async function AdminRewardsPage() {
  const tiers = await getAllRewardTiersAdmin();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif-display text-2xl text-[var(--color-charcoal)]">Rewards</h1>
        <p className="mt-1 text-sm text-[var(--color-charcoal)]/60">
          Manage the points-based reward tiers guests can redeem.
        </p>
      </div>
      <RewardTiersAdmin tiers={tiers} />
    </div>
  );
}
