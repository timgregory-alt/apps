-- Tennessee Wine Trails — migration 0072: daily time series for the admin
-- dashboard's stat-card hover sparklines.
--
-- admin_period_trends() (migration 0068) only ever returns two aggregate
-- points (this week vs last week, last 30 vs prev 30) — enough for an
-- arrow, not enough to draw a line. This returns one row per metric per
-- day for the last 30 days (zero-filled via generate_series, so every day
-- appears even with no activity), which the dashboard groups into a
-- sparkline per stat card.

create function public.admin_daily_trends()
returns table (metric text, day date, value numeric)
language sql
security definer
set search_path = public
stable
as $$
  with authorized as (
    select public.is_admin() as ok
  ),
  days as (
    select generate_series(current_date - interval '29 days', current_date, interval '1 day')::date as day
  ),
  accounts as (
    select d.day, count(p.id) as value
    from days d
    left join public.profiles p
      on p.created_at::date = d.day and p.winery_id is null and p.is_admin = false
    group by d.day
  ),
  checkins_agg as (
    select d.day, count(c.id) as value
    from days d
    left join public.checkins c on c.checkin_date::date = d.day
    group by d.day
  ),
  completions as (
    select d.day, count(tc.id) as value
    from days d
    left join public.trail_completions tc on tc.completed_at::date = d.day
    group by d.day
  ),
  wc as (
    select d.day, count(w.id) as value
    from days d
    left join public.wine_club_clicks w on w.created_at::date = d.day
    group by d.day
  ),
  pv as (
    select d.day, count(v.id) as value
    from days d
    left join public.winery_page_views v on v.created_at::date = d.day
    group by d.day
  ),
  qr as (
    select d.day, count(v.id) as value
    from days d
    left join public.winery_page_views v on v.created_at::date = d.day and v.source = 'qr'
    group by d.day
  ),
  se as (
    select d.day, count(s.id) as value
    from days d
    left join public.share_events s on s.created_at::date = d.day
    group by d.day
  ),
  subscriber_raw as (
    select c.user_id, c.checkin_date::date as day
    from public.checkins c
    join public.profiles p on p.id = c.user_id
    where p.is_subscriber
  ),
  subscriber_checkins as (
    select d.day, count(distinct sr.user_id) as value
    from days d
    left join subscriber_raw sr on sr.day = d.day
    group by d.day
  )
  select 'new_accounts', accounts.day, accounts.value::numeric
    from accounts, authorized where authorized.ok
  union all
  select 'checkins', checkins_agg.day, checkins_agg.value::numeric
    from checkins_agg, authorized where authorized.ok
  union all
  select 'trail_completions', completions.day, completions.value::numeric
    from completions, authorized where authorized.ok
  union all
  select 'wine_club_clicks', wc.day, wc.value::numeric
    from wc, authorized where authorized.ok
  union all
  select 'page_views', pv.day, pv.value::numeric
    from pv, authorized where authorized.ok
  union all
  select 'qr_scans', qr.day, qr.value::numeric
    from qr, authorized where authorized.ok
  union all
  select 'share_events', se.day, se.value::numeric
    from se, authorized where authorized.ok
  union all
  select 'subscriber_guests', subscriber_checkins.day, subscriber_checkins.value::numeric
    from subscriber_checkins, authorized where authorized.ok
$$;
