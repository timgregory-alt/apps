-- Tennessee Wine Trails — migration 0069: Travel Pass.
--
-- A one-time $19.99 purchase that grants full VIP perks (2x points, VIP
-- early access, subscriber reward discounts) for 2 days, without a
-- recurring subscription — the paid replacement for what the removed
-- free trial used to hand out for a single visit.
--
-- Also throws in 100 bonus points per purchase, permanently (not just
-- while the pass is active) — a concrete reason to buy one beyond the
-- temporary perks, and a hook that can draw a one-time tourist back to
-- redeem or earn more later.
--
-- Reuses the existing is_subscriber flag for every perk gate (points,
-- VIP access, discounts, admin/winery subscriber stats all already key
-- off it), so nothing else in the schema or app code needs to know a
-- Travel Pass exists. travel_pass_expires_at just tracks when a daily
-- cron (see /api/cron/expire-travel-passes) should flip is_subscriber
-- back to false for a travel-pass-only guest — it never touches a real
-- subscriber, since those always have stripe_subscription_id set.

alter table public.profiles add column if not exists travel_pass_expires_at timestamptz;
alter table public.profiles add column if not exists travel_pass_purchase_count integer not null default 0;
-- The Stripe Checkout Session id behind the most recent grant — lets
-- grant_travel_pass() ignore a duplicate webhook delivery for the same
-- purchase instead of double-counting the bonus points.
alter table public.profiles add column if not exists travel_pass_last_session_id text;

-- Atomically grants a Travel Pass purchase — increments the purchase
-- count (each purchase earns another round of bonus points) and resets
-- the expiry, in one statement so a read-then-write race can't
-- double-apply it. No-ops if session_id matches the last-recorded one,
-- so a retried webhook delivery for the same purchase is harmless.
create function public.grant_travel_pass(target_user_id uuid, expires_at timestamptz, session_id text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles
  set
    is_subscriber = true,
    travel_pass_expires_at = expires_at,
    travel_pass_purchase_count = travel_pass_purchase_count + 1,
    travel_pass_last_session_id = session_id
  where id = target_user_id
    and travel_pass_last_session_id is distinct from session_id;
$$;
