-- Tennessee Wine Trails — consolidated rewards setup.
--
-- Creates reward_tiers and reward_redemptions in their current, final
-- shape (equivalent to running migrations 0014, 0015, 0017, 0033, 0035,
-- and 0036 in order) as a single idempotent script. Safe to run even if
-- some pieces already exist.

create table if not exists public.reward_tiers (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  points_required integer not null,
  discount_percent integer not null check (discount_percent between 1 and 100),
  choice_options jsonb,
  birthday_only boolean not null default false,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tier_id uuid not null references public.reward_tiers (id) on delete cascade,
  code text not null unique,
  period_key text not null default '',
  chosen_option text,
  points_spent integer not null default 0,
  status text not null default 'issued' check (status in ('issued', 'redeemed')),
  issued_at timestamptz not null default now(),
  redeemed_at timestamptz
);

create index if not exists reward_tiers_active_idx on public.reward_tiers (active, sort_order);
create index if not exists reward_redemptions_user_idx on public.reward_redemptions (user_id);
create index if not exists reward_redemptions_code_idx on public.reward_redemptions (code);

-- At most one pending (unredeemed) code per guest per tier at a time —
-- once staff mark it redeemed, the guest can earn toward and redeem it again.
create unique index if not exists reward_redemptions_pending_idx
  on public.reward_redemptions (user_id, tier_id)
  where status = 'issued';

alter table public.reward_tiers enable row level security;
alter table public.reward_redemptions enable row level security;

drop policy if exists "Active reward tiers are public" on public.reward_tiers;
create policy "Active reward tiers are public" on public.reward_tiers
  for select using (active or public.is_admin());

drop policy if exists "Admins manage reward tiers" on public.reward_tiers;
create policy "Admins manage reward tiers" on public.reward_tiers
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Users view their own redemptions" on public.reward_redemptions;
create policy "Users view their own redemptions" on public.reward_redemptions
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users issue their own redemptions" on public.reward_redemptions;
create policy "Users issue their own redemptions" on public.reward_redemptions
  for insert with check (auth.uid() = user_id);

-- Seed the current reward ladder if it isn't there yet.
insert into public.reward_tiers (label, points_required, discount_percent, choice_options, birthday_only, sort_order, active)
select 'First Pour', 150, 10, null, false, 1, true
where not exists (select 1 from public.reward_tiers where label = 'First Pour');

insert into public.reward_tiers (label, points_required, discount_percent, choice_options, birthday_only, sort_order, active)
select 'Trail Blazer', 400, 15, null, false, 2, true
where not exists (select 1 from public.reward_tiers where label = 'Trail Blazer');

insert into public.reward_tiers (label, points_required, discount_percent, choice_options, birthday_only, sort_order, active)
select 'Estate Insider', 750, 20, null, false, 3, true
where not exists (select 1 from public.reward_tiers where label = 'Estate Insider');

insert into public.reward_tiers (label, points_required, discount_percent, choice_options, birthday_only, sort_order, active)
select
  'Sommelier''s Choice', 1250, 35,
  '["35% off your next purchase", "A complimentary tasting for two"]'::jsonb,
  false, 4, true
where not exists (select 1 from public.reward_tiers where label = 'Sommelier''s Choice');

insert into public.reward_tiers (label, points_required, discount_percent, choice_options, birthday_only, sort_order, active)
select 'Happy Birthday!', 0, 10, null, true, 99, true
where not exists (select 1 from public.reward_tiers where birthday_only = true);
