-- Tennessee Wine Trails — migration 0073: structured per-day weekly hours.
--
-- A winery can now fill out one row per day of the week (Monday..Sunday,
-- stored as day_of_week 0..6), each either marked closed or given an
-- open/close time — instead of typing a free-text hours string by hand.
-- When a winery has rows here, the app shows these instead of the plain
-- `hours` text field or the seasonal winery_hours table; either of those
-- stays as a fallback for a winery that hasn't filled this out yet.

create table if not exists public.winery_weekly_hours (
  id uuid primary key default gen_random_uuid(),
  winery_id uuid not null references public.wineries (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  is_closed boolean not null default false,
  open_time time,
  close_time time,
  created_at timestamptz not null default now(),
  unique (winery_id, day_of_week)
);

create index if not exists winery_weekly_hours_winery_idx on public.winery_weekly_hours (winery_id);

alter table public.winery_weekly_hours enable row level security;

drop policy if exists "Weekly hours are public" on public.winery_weekly_hours;
create policy "Weekly hours are public" on public.winery_weekly_hours
  for select using (true);

drop policy if exists "Admins manage weekly hours" on public.winery_weekly_hours;
create policy "Admins manage weekly hours" on public.winery_weekly_hours
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Winery staff manage their own weekly hours" on public.winery_weekly_hours;
create policy "Winery staff manage their own weekly hours" on public.winery_weekly_hours
  for all using (public.is_winery_staff_for(winery_id)) with check (public.is_winery_staff_for(winery_id));
