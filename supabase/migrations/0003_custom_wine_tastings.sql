-- Tennessee Wine Passport — migration 0003: user-added wine tastings
--
-- Run once in the Supabase SQL editor. Adds one new table so guests can log
-- a wine they tried that isn't in a winery's curated flight — entries are
-- private to the person who added them. Safe to run more than once.

create table if not exists public.custom_wine_tastings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  winery_id uuid not null references public.wineries (id) on delete cascade,
  name text not null,
  style text not null check (style in ('red', 'white', 'rose', 'sweet', 'sparkling')),
  notes text,
  liked boolean not null,
  created_at timestamptz not null default now()
);

create index if not exists custom_wine_tastings_user_idx on public.custom_wine_tastings (user_id);
create index if not exists custom_wine_tastings_winery_idx on public.custom_wine_tastings (winery_id);

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
