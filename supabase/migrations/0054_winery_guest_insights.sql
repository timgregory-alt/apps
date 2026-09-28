-- Tennessee Wine Trails — migration 0054: five more winery-facing metrics
-- (peak visit times, social shares, favorite wines, subscriber mix, guest
-- home distance), all built on data already collected — just never
-- surfaced to winery staff. Same SECURITY DEFINER pattern as every other
-- winery_* stats function so far: staff/admin access re-checked inside
-- the function itself, raw tables stay locked down via RLS.

-- Postgres won't let CREATE OR REPLACE change a function's output columns
-- — drop winery_conversion_stats first to add share_events and
-- subscriber_guests alongside the existing counts.
drop function if exists public.winery_conversion_stats(uuid);

create function public.winery_conversion_stats(target_winery_id uuid)
returns table (
  page_views integer,
  checkins integer,
  wine_club_clicks integer,
  avg_visitor_age numeric,
  share_events integer,
  subscriber_guests integer
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
    ),
    (select count(*)::integer from public.share_events where winery_id = target_winery_id),
    (
      select count(*)::integer
      from (select distinct user_id from public.checkins where winery_id = target_winery_id) c
      join public.profiles p on p.id = c.user_id
      where p.is_subscriber
    )
  where public.is_admin() or public.is_winery_staff_for(target_winery_id);
$$;

-- Peak visit day-of-week — Sunday..Saturday, always all 7 rows (0 counts
-- included) so the caller doesn't need to fill gaps.
create or replace function public.winery_visits_by_day_of_week(target_winery_id uuid)
returns table (day_label text, visit_count integer)
language sql
security definer
set search_path = public
stable
as $$
  select d.day_label, count(c.id)::integer as visit_count
  from (values (0,'Sun'),(1,'Mon'),(2,'Tue'),(3,'Wed'),(4,'Thu'),(5,'Fri'),(6,'Sat')) as d(day_num, day_label)
  left join public.checkins c
    on extract(dow from c.checkin_date) = d.day_num
    and c.winery_id = target_winery_id
    and (public.is_admin() or public.is_winery_staff_for(target_winery_id))
  group by d.day_num, d.day_label
  order by d.day_num;
$$;

-- Peak visit time of day, in four dayparts.
create or replace function public.winery_visits_by_daypart(target_winery_id uuid)
returns table (daypart text, visit_count integer)
language sql
security definer
set search_path = public
stable
as $$
  select d.daypart, count(c.id)::integer as visit_count
  from (values (0,'Morning (6am-12pm)'),(1,'Afternoon (12-5pm)'),(2,'Evening (5-9pm)'),(3,'Night (9pm-6am)')) as d(sort_order, daypart)
  left join public.checkins c
    on c.winery_id = target_winery_id
    and (public.is_admin() or public.is_winery_staff_for(target_winery_id))
    and (
      (d.sort_order = 0 and extract(hour from c.checkin_date) between 6 and 11) or
      (d.sort_order = 1 and extract(hour from c.checkin_date) between 12 and 16) or
      (d.sort_order = 2 and extract(hour from c.checkin_date) between 17 and 20) or
      (d.sort_order = 3 and (extract(hour from c.checkin_date) >= 21 or extract(hour from c.checkin_date) < 6))
    )
  group by d.sort_order, d.daypart
  order by d.sort_order;
$$;

-- Top 5 wines by "liked" ratings (>= 4 stars) at this winery.
create or replace function public.winery_top_wines(target_winery_id uuid)
returns table (wine_name text, liked_count integer)
language sql
security definer
set search_path = public
stable
as $$
  select w.name, count(*)::integer as liked_count
  from public.wine_tastings t
  join public.wines w on w.id = t.wine_id
  where w.winery_id = target_winery_id
    and t.rating >= 4
    and (public.is_admin() or public.is_winery_staff_for(target_winery_id))
  group by w.id, w.name
  order by liked_count desc
  limit 5;
$$;

-- Distinct guest zip codes for this winery, with visit counts — the app
-- computes distance/city from each zip client-side via the zipcodes
-- package, so this just needs to return the raw codes.
create or replace function public.winery_guest_zip_codes(target_winery_id uuid)
returns table (zip_code text, guest_count integer)
language sql
security definer
set search_path = public
stable
as $$
  select p.zip_code, count(*)::integer as guest_count
  from (select distinct user_id from public.checkins where winery_id = target_winery_id) c
  join public.profiles p on p.id = c.user_id
  where p.zip_code is not null
    and (public.is_admin() or public.is_winery_staff_for(target_winery_id))
  group by p.zip_code
  order by guest_count desc;
$$;
