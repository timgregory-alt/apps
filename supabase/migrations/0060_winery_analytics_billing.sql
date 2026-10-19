-- Tennessee Wine Trails — migration 0060: $50/mo winery analytics billing.
--
-- Mirrors the guest subscription columns on profiles (stripe_customer_id,
-- stripe_subscription_id, is_subscriber, subscription_status), but scoped
-- to the winery itself rather than any one staff account — a winery can
-- have multiple staff with portal access, and billing should follow the
-- winery, not whoever happened to click Subscribe. The existing Stripe
-- webhook is extended to sync this table by stripe_customer_id the same
-- way it already syncs profiles.

alter table public.wineries
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists analytics_subscribed boolean not null default false,
  add column if not exists analytics_subscription_status text;

create unique index if not exists wineries_stripe_customer_id_idx
  on public.wineries (stripe_customer_id)
  where stripe_customer_id is not null;
