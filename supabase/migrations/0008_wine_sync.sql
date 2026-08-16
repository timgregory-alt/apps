-- Tennessee Wine Passport — migration 0008: automatic wine-list sync
--
-- Adds an optional per-winery URL to check for new wines, plus a log
-- table recording each automated sync run. A scheduled job (see
-- src/app/api/cron/sync-wines/route.ts) periodically checks each
-- winery's site and auto-publishes any newly found wines.

alter table public.wineries
  add column if not exists wine_menu_url text;

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

drop policy if exists "Admins read wine sync log" on public.wine_sync_log;
create policy "Admins read wine sync log" on public.wine_sync_log
  for select using (public.is_admin());
