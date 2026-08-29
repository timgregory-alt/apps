-- Tennessee Wine Trails — full production catch-up script.
--
-- Your database currently only has schema.sql applied — policies.sql
-- (RLS + is_admin()) and every numbered migration since have never run.
-- This script brings everything up to the app's current state in one
-- pass, using final column/table names throughout (not the historical
-- in-between names some old migration files still reference). Safe to
-- run even if some pieces already exist — this supersedes every other
-- one-off SQL snippet given earlier in this session.

-- ===========================================================================
-- 1. Row Level Security + is_admin() — from policies.sql
-- ===========================================================================

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

alter table public.profiles enable row level security;
drop policy if exists "Profiles are viewable by their owner" on public.profiles;
create policy "Profiles are viewable by their owner" on public.profiles
  for select using (auth.uid() = id or public.is_admin());
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);
drop policy if exists "Admins can update any profile" on public.profiles;
create policy "Admins can update any profile" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

alter table public.trails enable row level security;
drop policy if exists "Active trails are public" on public.trails;
create policy "Active trails are public" on public.trails
  for select using (active or public.is_admin());
drop policy if exists "Admins manage trails" on public.trails;
create policy "Admins manage trails" on public.trails
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.wineries enable row level security;
drop policy if exists "Active wineries are public" on public.wineries;
create policy "Active wineries are public" on public.wineries
  for select using (active or public.is_admin());
drop policy if exists "Admins manage wineries" on public.wineries;
create policy "Admins manage wineries" on public.wineries
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.winery_hours enable row level security;
drop policy if exists "Winery hours are public" on public.winery_hours;
create policy "Winery hours are public" on public.winery_hours
  for select using (true);
drop policy if exists "Admins manage winery hours" on public.winery_hours;
create policy "Admins manage winery hours" on public.winery_hours
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.trail_wineries enable row level security;
drop policy if exists "Trail stops are public" on public.trail_wineries;
create policy "Trail stops are public" on public.trail_wineries
  for select using (true);
drop policy if exists "Admins manage trail stops" on public.trail_wineries;
create policy "Admins manage trail stops" on public.trail_wineries
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.wines enable row level security;
drop policy if exists "Active wines are public" on public.wines;
create policy "Active wines are public" on public.wines
  for select using (active or public.is_admin());
drop policy if exists "Admins manage wines" on public.wines;
create policy "Admins manage wines" on public.wines
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.wine_tastings enable row level security;
drop policy if exists "Users view their own wine tastings" on public.wine_tastings;
create policy "Users view their own wine tastings" on public.wine_tastings
  for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists "Users record their own wine tastings" on public.wine_tastings;
create policy "Users record their own wine tastings" on public.wine_tastings
  for insert with check (auth.uid() = user_id);
drop policy if exists "Users update their own wine tastings" on public.wine_tastings;
create policy "Users update their own wine tastings" on public.wine_tastings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.custom_wine_tastings enable row level security;
drop policy if exists "Users view their own custom wine tastings" on public.custom_wine_tastings;
create policy "Users view their own custom wine tastings" on public.custom_wine_tastings
  for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists "Users create their own custom wine tastings" on public.custom_wine_tastings;
create policy "Users create their own custom wine tastings" on public.custom_wine_tastings
  for insert with check (auth.uid() = user_id);
drop policy if exists "Users delete their own custom wine tastings" on public.custom_wine_tastings;
create policy "Users delete their own custom wine tastings" on public.custom_wine_tastings
  for delete using (auth.uid() = user_id);

alter table public.checkins enable row level security;
drop policy if exists "Users view their own checkins" on public.checkins;
create policy "Users view their own checkins" on public.checkins
  for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists "Users create their own checkins" on public.checkins;
create policy "Users create their own checkins" on public.checkins
  for insert with check (auth.uid() = user_id);

alter table public.share_events enable row level security;
drop policy if exists "Users view their own share events" on public.share_events;
create policy "Users view their own share events" on public.share_events
  for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists "Users log their own share events" on public.share_events;
create policy "Users log their own share events" on public.share_events
  for insert with check (auth.uid() = user_id);

alter table public.wine_club_clicks enable row level security;
drop policy if exists "Users view their own wine club clicks" on public.wine_club_clicks;
create policy "Users view their own wine club clicks" on public.wine_club_clicks
  for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists "Users log their own wine club clicks" on public.wine_club_clicks;
create policy "Users log their own wine club clicks" on public.wine_club_clicks
  for insert with check (auth.uid() = user_id);

alter table public.winery_page_views enable row level security;
drop policy if exists "Anyone can log a page view" on public.winery_page_views;
create policy "Anyone can log a page view" on public.winery_page_views
  for insert with check (user_id is null or auth.uid() = user_id);
drop policy if exists "Only admins read page views" on public.winery_page_views;
create policy "Only admins read page views" on public.winery_page_views
  for select using (public.is_admin());

alter table public.trail_completions enable row level security;
drop policy if exists "Users view their own completions" on public.trail_completions;
create policy "Users view their own completions" on public.trail_completions
  for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists "Users record their own completions" on public.trail_completions;
create policy "Users record their own completions" on public.trail_completions
  for insert with check (auth.uid() = user_id);

-- ===========================================================================
-- 2. New columns on existing tables
-- ===========================================================================

alter table public.profiles add column if not exists birth_date date;
alter table public.profiles add column if not exists birth_date_locked boolean not null default false;
alter table public.profiles add column if not exists is_subscriber boolean not null default false;
alter table public.profiles add column if not exists zip_code text;
alter table public.profiles add column if not exists agreed_to_terms_at timestamptz;
alter table public.profiles add column if not exists referred_by uuid references public.profiles (id) on delete set null;

alter table public.wineries add column if not exists wine_menu_url text;
alter table public.wineries add column if not exists events_page_url text;
alter table public.wineries add column if not exists yelp_url text;

alter table public.wines add column if not exists sold_out boolean not null default false;

alter table public.wines drop constraint if exists wines_style_check;
alter table public.wines
  add constraint wines_style_check
  check (style in ('red', 'white', 'rose', 'sweet', 'sparkling', 'mead'));

alter table public.custom_wine_tastings drop constraint if exists custom_wine_tastings_style_check;
alter table public.custom_wine_tastings
  add constraint custom_wine_tastings_style_check
  check (style in ('red', 'white', 'rose', 'sweet', 'sparkling', 'mead'));

-- wine_tastings: replace the original like/pass toggle with a 1-5 star
-- rating (table is empty in practice — no wines existed yet to rate).
alter table public.wine_tastings add column if not exists rating smallint;
update public.wine_tastings set rating = case when liked then 4 else 2 end where rating is null;
alter table public.wine_tastings alter column rating set not null;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'wine_tastings_rating_range') then
    alter table public.wine_tastings add constraint wine_tastings_rating_range check (rating between 1 and 5);
  end if;
end $$;
alter table public.wine_tastings drop column if exists liked;

-- checkins: allow repeat check-ins, one per winery per 24 hours (enforced
-- in the app, not the database).
alter table public.checkins drop constraint if exists checkins_user_id_winery_id_key;
create index if not exists checkins_user_winery_date_idx
  on public.checkins (user_id, winery_id, checkin_date desc);

-- ===========================================================================
-- 3. New tables
-- ===========================================================================

create table if not exists public.wine_sync_log (
  id uuid primary key default gen_random_uuid(),
  winery_id uuid not null references public.wineries (id) on delete cascade,
  ran_at timestamptz not null default now(),
  wines_added integer not null default 0,
  status text not null check (status in ('ok', 'error')),
  detail text
);
create index if not exists wine_sync_log_winery_idx on public.wine_sync_log (winery_id, ran_at desc);
alter table public.wine_sync_log enable row level security;
drop policy if exists "Admins manage wine sync log" on public.wine_sync_log;
create policy "Admins manage wine sync log" on public.wine_sync_log
  for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.winery_events (
  id uuid primary key default gen_random_uuid(),
  winery_id uuid not null references public.wineries (id) on delete cascade,
  title text not null,
  description text,
  event_date date not null,
  event_time text,
  source_url text,
  created_at timestamptz not null default now(),
  unique (winery_id, title, event_date)
);
create index if not exists winery_events_date_idx on public.winery_events (event_date);
create index if not exists winery_events_winery_idx on public.winery_events (winery_id);
alter table public.winery_events enable row level security;
drop policy if exists "Upcoming events are public" on public.winery_events;
create policy "Upcoming events are public" on public.winery_events for select using (true);
drop policy if exists "Admins manage events" on public.winery_events;
create policy "Admins manage events" on public.winery_events
  for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.event_sync_log (
  id uuid primary key default gen_random_uuid(),
  winery_id uuid not null references public.wineries (id) on delete cascade,
  ran_at timestamptz not null default now(),
  events_added integer not null default 0,
  status text not null check (status in ('ok', 'error')),
  detail text
);
create index if not exists event_sync_log_winery_idx on public.event_sync_log (winery_id, ran_at desc);
alter table public.event_sync_log enable row level security;
drop policy if exists "Admins manage event sync log" on public.event_sync_log;
create policy "Admins manage event sync log" on public.event_sync_log
  for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.app_ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists app_ratings_user_idx on public.app_ratings (user_id);
alter table public.app_ratings enable row level security;
drop policy if exists "Users view their own app rating" on public.app_ratings;
create policy "Users view their own app rating" on public.app_ratings
  for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists "Users submit their own app rating" on public.app_ratings;
create policy "Users submit their own app rating" on public.app_ratings
  for insert with check (auth.uid() = user_id);
drop policy if exists "Users update their own app rating" on public.app_ratings;
create policy "Users update their own app rating" on public.app_ratings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.bug_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  description text not null,
  page_url text,
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now()
);
create index if not exists bug_reports_status_idx on public.bug_reports (status, created_at);
alter table public.bug_reports enable row level security;
drop policy if exists "Users view their own bug reports" on public.bug_reports;
create policy "Users view their own bug reports" on public.bug_reports
  for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists "Users submit their own bug reports" on public.bug_reports;
create policy "Users submit their own bug reports" on public.bug_reports
  for insert with check (auth.uid() = user_id);
drop policy if exists "Admins update bug report status" on public.bug_reports;
create policy "Admins update bug report status" on public.bug_reports
  for update using (public.is_admin()) with check (public.is_admin());

-- ===========================================================================
-- 4. Functions and triggers (final versions)
-- ===========================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  ref_id uuid;
begin
  begin
    ref_id := nullif(new.raw_user_meta_data ->> 'referred_by', '')::uuid;
  exception when others then
    ref_id := null;
  end;

  if ref_id is not null and not exists (select 1 from public.profiles where id = ref_id) then
    ref_id := null;
  end if;

  insert into public.profiles (
    id, email, name, birth_date, zip_code, trail_start_date, referred_by, agreed_to_terms_at
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data ->> 'birth_date', '')::date,
    nullif(new.raw_user_meta_data ->> 'zip_code', ''),
    now(),
    ref_id,
    case when (new.raw_user_meta_data ->> 'terms_accepted') = 'true' then now() else null end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.count_qualifying_referrals()
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::integer
  from public.profiles p
  where p.referred_by = auth.uid()
    and exists (select 1 from public.checkins c where c.user_id = p.id);
$$;

create or replace function public.handle_user_email_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update on auth.users
  for each row execute procedure public.handle_user_email_update();

-- ===========================================================================
-- 5. Rewards system (reward_tiers + reward_redemptions), current shape
-- ===========================================================================

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

-- ===========================================================================
-- 6. One-time: make your own account an admin (edit the email first!)
-- ===========================================================================
-- update public.profiles set is_admin = true where email = 'you@example.com';
