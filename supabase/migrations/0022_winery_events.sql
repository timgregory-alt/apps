-- Tennessee Wine Passport — migration 0022: winery events.
--
-- Mirrors the existing wine-sync pattern (0008_wine_sync.sql): a weekly
-- scheduled job reads each winery's events page and extracts upcoming
-- events with Claude, so events stay current without manual admin entry.

alter table public.wineries add column if not exists events_page_url text;

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

create policy "Upcoming events are public" on public.winery_events
  for select using (true);

create policy "Admins manage events" on public.winery_events
  for all using (public.is_admin()) with check (public.is_admin());

-- No RLS, matching wine_sync_log — write-only record-keeping, not read by
-- any client UI yet.
create table if not exists public.event_sync_log (
  id uuid primary key default gen_random_uuid(),
  winery_id uuid not null references public.wineries (id) on delete cascade,
  ran_at timestamptz not null default now(),
  events_added integer not null default 0,
  status text not null check (status in ('ok', 'error')),
  detail text
);

create index if not exists event_sync_log_winery_idx on public.event_sync_log (winery_id, ran_at desc);
