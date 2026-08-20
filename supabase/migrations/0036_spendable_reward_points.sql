-- Tennessee Wine Trails — migration 0036: spendable points, like airline miles.
--
-- Previously a reward tier could only ever be redeemed once per guest, and
-- crossing a tier's point threshold just unlocked it forever — nothing was
-- ever actually spent. This switches to a real spend model, closer to an
-- airline status/miles program: reaching a tier's threshold is a permanent
-- status (based on lifetime points, which only ever go up — see
-- src/lib/rewards.ts), but *redeeming* a reward spends that tier's point
-- cost out of a separate spendable balance (lifetime points minus points
-- already spent). Once a guest earns enough again, they can redeem that
-- same tier again — rewarding repeat visits, not just a single claim.

alter table public.reward_redemptions
  drop constraint if exists reward_redemptions_user_tier_period_key;

alter table public.reward_redemptions
  add column if not exists points_spent integer not null default 0;

-- At most one *pending* (unredeemed) code per guest per tier at a time —
-- once staff mark it redeemed at /redeem, the guest is free to earn
-- toward and redeem that tier again. Redeemed history rows are unlimited.
create unique index if not exists reward_redemptions_pending_idx
  on public.reward_redemptions (user_id, tier_id)
  where status = 'issued';
