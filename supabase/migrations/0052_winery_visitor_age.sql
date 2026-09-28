-- Tennessee Wine Trails — migration 0052: average visitor age, using the
-- birth date already collected at signup for 21+ verification.
--
-- Extends winery_conversion_stats() (migration 0051) with avg_visitor_age
-- — the average current age of guests who have checked in at that winery,
-- computed from profiles.birth_date. Guests who skipped birth date at
-- signup (older accounts, before it was required) are simply excluded
-- rather than skewing the average.

-- Postgres won't let CREATE OR REPLACE change a function's output columns
-- (adding avg_visitor_age counts as changing the return type) — drop it
-- first.
drop function if exists public.winery_conversion_stats(uuid);

create function public.winery_conversion_stats(target_winery_id uuid)
returns table (
  page_views integer,
  checkins integer,
  wine_club_clicks integer,
  avg_visitor_age numeric
)
language sql
security definer
set search_path = public
stable
as $$
  select
    (select count(*)::integer from public.winery_page_views where winery_id = target_winery_id),
    (select count(*)::integer from public.checkins where winery_id = target_winery_id),
    (select count(*)::integer from public.wine_club_clicks where winery_id = target_winery_id),
    (
      select round(avg(extract(year from age(current_date, p.birth_date))), 1)
      from (select distinct user_id from public.checkins where winery_id = target_winery_id) c
      join public.profiles p on p.id = c.user_id
      where p.birth_date is not null
    )
  where public.is_admin() or public.is_winery_staff_for(target_winery_id);
$$;
