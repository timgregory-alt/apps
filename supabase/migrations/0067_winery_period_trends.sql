-- Tennessee Wine Trails — migration 0067: add a 30-day trend alongside
-- the existing 7-day one, for the hover detail on each portal stat card.
--
-- Supersedes winery_weekly_trends() (migration 0066) with
-- winery_period_trends(), which returns both windows in one pass over
-- the same tables instead of querying them twice.

drop function if exists public.winery_weekly_trends(uuid);

create function public.winery_period_trends(target_winery_id uuid)
returns table (metric text, this_week numeric, last_week numeric, last_30 numeric, prev_30 numeric)
language sql
security definer
set search_path = public
stable
as $$
  with authorized as (
    select (public.is_admin() or public.is_winery_staff_for(target_winery_id)) as ok
  ),
  bounds as (
    select
      now() - interval '7 days' as week_start,
      now() - interval '14 days' as prev_week_start,
      now() - interval '30 days' as month_start,
      now() - interval '60 days' as prev_month_start
  ),
  qr as (
    select
      count(*) filter (where created_at >= (select week_start from bounds)) as this_week,
      count(*) filter (
        where created_at >= (select prev_week_start from bounds) and created_at < (select week_start from bounds)
      ) as last_week,
      count(*) filter (where created_at >= (select month_start from bounds)) as last_30,
      count(*) filter (
        where created_at >= (select prev_month_start from bounds) and created_at < (select month_start from bounds)
      ) as prev_30
    from public.winery_page_views
    where winery_id = target_winery_id and source = 'qr'
  ),
  pv as (
    select
      count(*) filter (where created_at >= (select week_start from bounds)) as this_week,
      count(*) filter (
        where created_at >= (select prev_week_start from bounds) and created_at < (select week_start from bounds)
      ) as last_week,
      count(*) filter (where created_at >= (select month_start from bounds)) as last_30,
      count(*) filter (
        where created_at >= (select prev_month_start from bounds) and created_at < (select month_start from bounds)
      ) as prev_30
    from public.winery_page_views
    where winery_id = target_winery_id
  ),
  wc as (
    select
      count(*) filter (where created_at >= (select week_start from bounds)) as this_week,
      count(*) filter (
        where created_at >= (select prev_week_start from bounds) and created_at < (select week_start from bounds)
      ) as last_week,
      count(*) filter (where created_at >= (select month_start from bounds)) as last_30,
      count(*) filter (
        where created_at >= (select prev_month_start from bounds) and created_at < (select month_start from bounds)
      ) as prev_30
    from public.wine_club_clicks
    where winery_id = target_winery_id
  ),
  se as (
    select
      count(*) filter (where created_at >= (select week_start from bounds)) as this_week,
      count(*) filter (
        where created_at >= (select prev_week_start from bounds) and created_at < (select week_start from bounds)
      ) as last_week,
      count(*) filter (where created_at >= (select month_start from bounds)) as last_30,
      count(*) filter (
        where created_at >= (select prev_month_start from bounds) and created_at < (select month_start from bounds)
      ) as prev_30
    from public.share_events
    where winery_id = target_winery_id
  ),
  guest_activity as (
    select
      c.user_id,
      min(c.checkin_date) as first_visit,
      bool_or(c.checkin_date >= (select week_start from bounds)) as visited_this_week,
      bool_or(
        c.checkin_date >= (select prev_week_start from bounds) and c.checkin_date < (select week_start from bounds)
      ) as visited_last_week,
      bool_or(c.checkin_date >= (select month_start from bounds)) as visited_last_30,
      bool_or(
        c.checkin_date >= (select prev_month_start from bounds) and c.checkin_date < (select month_start from bounds)
      ) as visited_prev_30
    from public.checkins c
    where c.winery_id = target_winery_id
    group by c.user_id
  ),
  guest_summary as (
    select
      count(*) filter (where visited_this_week) as total_this_week,
      count(*) filter (where visited_last_week) as total_last_week,
      count(*) filter (where visited_last_30) as total_last_30,
      count(*) filter (where visited_prev_30) as total_prev_30,
      count(*) filter (where visited_this_week and first_visit >= (select week_start from bounds))
        as onetime_this_week,
      count(*) filter (
        where visited_last_week
          and first_visit >= (select prev_week_start from bounds)
          and first_visit < (select week_start from bounds)
      ) as onetime_last_week,
      count(*) filter (where visited_last_30 and first_visit >= (select month_start from bounds))
        as onetime_last_30,
      count(*) filter (
        where visited_prev_30
          and first_visit >= (select prev_month_start from bounds)
          and first_visit < (select month_start from bounds)
      ) as onetime_prev_30,
      count(*) filter (where visited_this_week and first_visit < (select week_start from bounds))
        as repeat_this_week,
      count(*) filter (where visited_last_week and first_visit < (select prev_week_start from bounds))
        as repeat_last_week,
      count(*) filter (where visited_last_30 and first_visit < (select month_start from bounds))
        as repeat_last_30,
      count(*) filter (where visited_prev_30 and first_visit < (select prev_month_start from bounds))
        as repeat_prev_30
    from guest_activity
  ),
  subscriber_activity as (
    select
      count(distinct ga.user_id) filter (where ga.visited_this_week) as this_week,
      count(distinct ga.user_id) filter (where ga.visited_last_week) as last_week,
      count(distinct ga.user_id) filter (where ga.visited_last_30) as last_30,
      count(distinct ga.user_id) filter (where ga.visited_prev_30) as prev_30
    from guest_activity ga
    join public.profiles p on p.id = ga.user_id
    where p.is_subscriber
  ),
  age_this_week as (
    select avg(extract(year from age(current_date, p.birth_date))) as avg_age
    from guest_activity ga join public.profiles p on p.id = ga.user_id
    where ga.visited_this_week and p.birth_date is not null
  ),
  age_last_week as (
    select avg(extract(year from age(current_date, p.birth_date))) as avg_age
    from guest_activity ga join public.profiles p on p.id = ga.user_id
    where ga.visited_last_week and p.birth_date is not null
  ),
  age_last_30 as (
    select avg(extract(year from age(current_date, p.birth_date))) as avg_age
    from guest_activity ga join public.profiles p on p.id = ga.user_id
    where ga.visited_last_30 and p.birth_date is not null
  ),
  age_prev_30 as (
    select avg(extract(year from age(current_date, p.birth_date))) as avg_age
    from guest_activity ga join public.profiles p on p.id = ga.user_id
    where ga.visited_prev_30 and p.birth_date is not null
  )
  select 'qr_scans', qr.this_week::numeric, qr.last_week::numeric, qr.last_30::numeric, qr.prev_30::numeric
    from qr, authorized where authorized.ok
  union all
  select 'page_views', pv.this_week::numeric, pv.last_week::numeric, pv.last_30::numeric, pv.prev_30::numeric
    from pv, authorized where authorized.ok
  union all
  select 'wine_club_clicks', wc.this_week::numeric, wc.last_week::numeric, wc.last_30::numeric, wc.prev_30::numeric
    from wc, authorized where authorized.ok
  union all
  select 'share_events', se.this_week::numeric, se.last_week::numeric, se.last_30::numeric, se.prev_30::numeric
    from se, authorized where authorized.ok
  union all
  select 'total_guests', gs.total_this_week::numeric, gs.total_last_week::numeric,
    gs.total_last_30::numeric, gs.total_prev_30::numeric
    from guest_summary gs, authorized where authorized.ok
  union all
  select 'one_time_guests', gs.onetime_this_week::numeric, gs.onetime_last_week::numeric,
    gs.onetime_last_30::numeric, gs.onetime_prev_30::numeric
    from guest_summary gs, authorized where authorized.ok
  union all
  select 'repeat_guests', gs.repeat_this_week::numeric, gs.repeat_last_week::numeric,
    gs.repeat_last_30::numeric, gs.repeat_prev_30::numeric
    from guest_summary gs, authorized where authorized.ok
  union all
  select 'subscriber_guests', sa.this_week::numeric, sa.last_week::numeric, sa.last_30::numeric, sa.prev_30::numeric
    from subscriber_activity sa, authorized where authorized.ok
  union all
  select 'avg_visitor_age', atw.avg_age, alw.avg_age, al30.avg_age, ap30.avg_age
    from age_this_week atw, age_last_week alw, age_last_30 al30, age_prev_30 ap30, authorized
    where authorized.ok
$$;
