-- Tennessee Wine Passport — migration 0007: seasonal hours
--
-- Adds a winery_hours table so a winery can have multiple date-range
-- seasons (e.g. "Apr–Oct" vs "Nov–Mar") instead of one flat hours string.
-- A winery with no rows here just keeps showing its plain `hours` field.
-- Seeds Arrington Vineyards' real 4-season schedule — the only winery with
-- published seasonal hours found so far. Add the other three via
-- /admin/wineries/[id] once you have their seasonal schedules.
-- Safe to run more than once.

create table if not exists public.winery_hours (
  id uuid primary key default gen_random_uuid(),
  winery_id uuid not null references public.wineries (id) on delete cascade,
  label text not null,
  start_month smallint not null check (start_month between 1 and 12),
  end_month smallint not null check (end_month between 1 and 12),
  hours_text text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists winery_hours_winery_idx on public.winery_hours (winery_id, sort_order);

alter table public.winery_hours enable row level security;

drop policy if exists "Winery hours are public" on public.winery_hours;
create policy "Winery hours are public" on public.winery_hours
  for select using (true);

drop policy if exists "Admins manage winery hours" on public.winery_hours;
create policy "Admins manage winery hours" on public.winery_hours
  for all using (public.is_admin()) with check (public.is_admin());

delete from public.winery_hours
where winery_id = (select id from public.wineries where slug = 'arrington-vineyards');

insert into public.winery_hours (winery_id, label, start_month, end_month, hours_text, sort_order)
select w.id, v.label, v.start_month, v.end_month, v.hours_text, v.sort_order
from public.wineries w
cross join (
  values
    ('April – October', 4, 10, 'Mon–Thu 11am–8pm · Fri 11am–9pm · Sat 11am–8pm · Sun 12pm–8pm', 1),
    ('November – December', 11, 12, 'Mon–Sat 11am–8pm · Sun 12pm–6pm', 2),
    ('January – February', 1, 2, 'Mon–Sat 11am–6pm · Sun 12pm–6pm', 3),
    ('March', 3, 3, 'Mon–Thu 11am–7pm · Fri–Sat 11am–8pm · Sun 12pm–7pm', 4)
) as v(label, start_month, end_month, hours_text, sort_order)
where w.slug = 'arrington-vineyards';
