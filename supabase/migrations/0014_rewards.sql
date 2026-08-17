-- Tennessee Wine Passport — migration 0014: points-based rewards.
--
-- Points are derived (check-ins, wine ratings, passport completion) and
-- never stored. reward_tiers are admin-managed thresholds ("150 points ->
-- 15% off"). reward_redemptions is issued once per user per tier the first
-- time they claim it, carrying a one-time redemption code shown to the
-- guest as both a QR code and a manual fallback code. Winery staff redeem
-- it at /redeem/<code> or by typing the code in at /redeem — that page has
-- no login, so it reads/writes through the service-role client rather than
-- through these RLS policies.

create table if not exists public.reward_tiers (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  points_required integer not null,
  discount_percent integer not null check (discount_percent between 1 and 100),
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists reward_tiers_active_idx on public.reward_tiers (active, sort_order);

insert into public.reward_tiers (label, points_required, discount_percent, sort_order, active)
select '15% Off Your Next Bottle', 150, 15, 1, true
where not exists (select 1 from public.reward_tiers);

create table if not exists public.reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tier_id uuid not null references public.reward_tiers (id) on delete cascade,
  code text not null unique,
  status text not null default 'issued' check (status in ('issued', 'redeemed')),
  issued_at timestamptz not null default now(),
  redeemed_at timestamptz,
  unique (user_id, tier_id)
);

create index if not exists reward_redemptions_user_idx on public.reward_redemptions (user_id);
create index if not exists reward_redemptions_code_idx on public.reward_redemptions (code);

alter table public.reward_tiers enable row level security;
alter table public.reward_redemptions enable row level security;

create policy "Active reward tiers are public" on public.reward_tiers
  for select using (active or public.is_admin());

create policy "Admins manage reward tiers" on public.reward_tiers
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Users view their own redemptions" on public.reward_redemptions
  for select using (auth.uid() = user_id or public.is_admin());

create policy "Users issue their own redemptions" on public.reward_redemptions
  for insert with check (auth.uid() = user_id);
