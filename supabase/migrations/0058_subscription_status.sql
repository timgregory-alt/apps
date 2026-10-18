-- Tennessee Wine Trails — migration 0058: store the real Stripe
-- subscription status.
--
-- profiles.is_subscriber is just a boolean (trialing and active both count
-- as "subscribed"), so the admin Members list had no way to show "Trial"
-- vs. "Subscribed" distinctly. Adds the raw Stripe status string alongside
-- it — the webhook sets it from subscription.status on every sync.

alter table public.profiles add column if not exists subscription_status text;
