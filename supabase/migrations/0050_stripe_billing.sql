-- Tennessee Wine Trails — migration 0050: real Stripe billing for
-- subscriptions, replacing the manual is_subscriber preview toggle.
--
-- is_subscriber itself (added in migration 0025) doesn't change — every
-- other feature already gates on it, so nothing downstream needs to
-- change. What's new is tracking which Stripe customer/subscription a
-- profile corresponds to, so the webhook (which only knows the Stripe
-- customer id) can find the right profile row to update, and so a guest
-- can be sent to the Stripe Customer Portal to manage their existing
-- subscription.

alter table public.profiles add column if not exists stripe_customer_id text;
alter table public.profiles add column if not exists stripe_subscription_id text;

create unique index if not exists profiles_stripe_customer_id_idx
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;
