-- Tennessee Wine Passport — core schema
-- Run this in the Supabase SQL editor (or via `supabase db push`) before policies.sql and seed.sql.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles  (extends auth.users — Supabase Auth owns the users table itself)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  email text,
  profile_image text,
  is_admin boolean not null default false,
  passport_start_date timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, passport_start_date)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- trails  (a "trail" is a themed collection of wineries — e.g. the Founding
-- Trail today, with room for Nashville / East TN / seasonal trails later)
-- ---------------------------------------------------------------------------
create table if not exists public.trails (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image text,
  active boolean not null default true,
  -- monetization readiness: a trail can eventually be sponsored/featured
  sponsored boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- wineries
-- ---------------------------------------------------------------------------
create table if not exists public.wineries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  city text not null,
  state text not null default 'Tennessee',
  address text not null,
  latitude double precision not null,
  longitude double precision not null,
  description text not null default '',
  hero_image text,
  logo_mark text,
  website_url text,
  wine_club_url text,
  wine_club_title text,
  wine_club_description text,
  wine_club_benefits text[] not null default '{}',
  hours text,
  phone text,
  instagram_url text,
  facebook_url text,
  -- GPS check-in geofence, in meters (spec default ~500-1000 ft / 150-300m; seed uses 750ft)
  checkin_radius_meters integer not null default 228,
  active boolean not null default true,
  sort_order integer not null default 0,
  -- monetization readiness
  sponsored boolean not null default false,
  featured boolean not null default false,
  subscription_status text not null default 'none'
    check (subscription_status in ('none', 'trial', 'active', 'past_due')),
  created_at timestamptz not null default now()
);

create index if not exists wineries_active_idx on public.wineries (active);
create index if not exists wineries_slug_idx on public.wineries (slug);

-- ---------------------------------------------------------------------------
-- trail_wineries  (join table — ordered stops of a trail)
-- ---------------------------------------------------------------------------
create table if not exists public.trail_wineries (
  id uuid primary key default gen_random_uuid(),
  trail_id uuid not null references public.trails (id) on delete cascade,
  winery_id uuid not null references public.wineries (id) on delete cascade,
  display_order integer not null default 0,
  unique (trail_id, winery_id)
);

create index if not exists trail_wineries_trail_idx on public.trail_wineries (trail_id, display_order);
create index if not exists trail_wineries_winery_idx on public.trail_wineries (winery_id);

-- ---------------------------------------------------------------------------
-- wines  (a small tasting flight per winery)
-- ---------------------------------------------------------------------------
create table if not exists public.wines (
  id uuid primary key default gen_random_uuid(),
  winery_id uuid not null references public.wineries (id) on delete cascade,
  name text not null,
  slug text not null unique,
  varietal text not null,
  style text not null check (style in ('red', 'white', 'rose', 'sweet', 'sparkling')),
  tasting_notes text not null default '',
  food_pairing text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists wines_winery_idx on public.wines (winery_id);
create index if not exists wines_active_idx on public.wines (active);

-- ---------------------------------------------------------------------------
-- wine_tastings  (a user's like/pass on a wine — powers recommendations)
-- ---------------------------------------------------------------------------
create table if not exists public.wine_tastings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  wine_id uuid not null references public.wines (id) on delete cascade,
  liked boolean not null,
  created_at timestamptz not null default now(),
  unique (user_id, wine_id)
);

create index if not exists wine_tastings_user_idx on public.wine_tastings (user_id);
create index if not exists wine_tastings_wine_idx on public.wine_tastings (wine_id);

-- ---------------------------------------------------------------------------
-- custom_wine_tastings  (a wine a user tried that isn't in the curated
-- flight — personal to them, not shown to other guests)
-- ---------------------------------------------------------------------------
create table if not exists public.custom_wine_tastings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  winery_id uuid not null references public.wineries (id) on delete cascade,
  name text not null,
  style text not null check (style in ('red', 'white', 'rose', 'sweet', 'sparkling')),
  notes text,
  food_pairing text,
  liked boolean not null,
  created_at timestamptz not null default now()
);

create index if not exists custom_wine_tastings_user_idx on public.custom_wine_tastings (user_id);
create index if not exists custom_wine_tastings_winery_idx on public.custom_wine_tastings (winery_id);

-- ---------------------------------------------------------------------------
-- checkins  (one verified GPS check-in per user per winery)
-- ---------------------------------------------------------------------------
create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  winery_id uuid not null references public.wineries (id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  distance_meters integer,
  checkin_date timestamptz not null default now(),
  verified boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, winery_id)
);

create index if not exists checkins_user_idx on public.checkins (user_id);
create index if not exists checkins_winery_idx on public.checkins (winery_id);

-- ---------------------------------------------------------------------------
-- share_events  (social sharing analytics)
-- ---------------------------------------------------------------------------
create table if not exists public.share_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  winery_id uuid references public.wineries (id) on delete set null,
  share_type text not null check (
    share_type in (
      'winery_checkin', 'passport_completion', 'native_share',
      'copy_link', 'facebook', 'instagram', 'save_image'
    )
  ),
  created_at timestamptz not null default now()
);

create index if not exists share_events_winery_idx on public.share_events (winery_id);
create index if not exists share_events_user_idx on public.share_events (user_id);

-- ---------------------------------------------------------------------------
-- wine_club_clicks
-- ---------------------------------------------------------------------------
create table if not exists public.wine_club_clicks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  winery_id uuid not null references public.wineries (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists wine_club_clicks_winery_idx on public.wine_club_clicks (winery_id);

-- ---------------------------------------------------------------------------
-- winery_page_views  (lightweight analytics — anonymous or authenticated)
-- ---------------------------------------------------------------------------
create table if not exists public.winery_page_views (
  id uuid primary key default gen_random_uuid(),
  winery_id uuid not null references public.wineries (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists winery_page_views_winery_idx on public.winery_page_views (winery_id);

-- ---------------------------------------------------------------------------
-- rewards  (attachable to a trail's completion — none are active in v1)
-- ---------------------------------------------------------------------------
create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  trail_id uuid not null references public.trails (id) on delete cascade,
  name text not null,
  description text,
  reward_type text not null check (
    reward_type in ('merchandise', 'discount', 'tasting', 'bottle', 'giveaway')
  ),
  active boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- passport_completions
-- ---------------------------------------------------------------------------
create table if not exists public.passport_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  trail_id uuid not null references public.trails (id) on delete cascade,
  reward_id uuid references public.rewards (id) on delete set null,
  reward_redeemed_at timestamptz,
  completed_at timestamptz not null default now(),
  unique (user_id, trail_id)
);

create index if not exists passport_completions_user_idx on public.passport_completions (user_id);
