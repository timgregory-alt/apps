-- Tennessee Wine Trails — migration 0068: site-wide trend arrows for the
-- admin dashboard, same shape and windows as winery_period_trends() but
-- scoped to the whole trail rather than one winery, and admin-only.

create function public.admin_period_trends()
returns table (metric text, this_week numeric, last_week numeric, last_30 numeric, prev_30 numeric)
language sql
security definer
set search_path = public
stable
as $$
  with authorized as (
    select public.is_admin() as ok
  ),
  bounds as (
    select
      now() - interval '7 days' as week_start,
      now() - interval '14 days' as prev_week_start,
      now() - interval '30 days' as month_start,
      now() - interval '60 days' as prev_month_start
  ),
  accounts as (
    select
      count(*) filter (where created_at >= (select week_start from bounds)) as this_week,
      count(*) filter (
        where created_at >= (select prev_week_start from bounds) and created_at < (select week_start from bounds)
      ) as last_week,
      count(*) filter (where created_at >= (select month_start from bounds)) as last_30,
      count(*) filter (
        where created_at >= (select prev_month_start from bounds) and created_at < (select month_start from bounds)
      ) as prev_30
    from public.profiles
    where winery_id is null and is_admin = false
  ),
  checkins_agg as (
    select
      count(*) filter (where checkin_date >= (select week_start from bounds)) as this_week,
      count(*) filter (
        where checkin_date >= (select prev_week_start from bounds) and checkin_date < (select week_start from bounds)
      ) as last_week,
      count(*) filter (where checkin_date >= (select month_start from bounds)) as last_30,
      count(*) filter (
        where checkin_date >= (select prev_month_start from bounds) and checkin_date < (select month_start from bounds)
      ) as prev_30
    from public.checkins
  ),
  completions as (
    select
      count(*) filter (where completed_at >= (select week_start from bounds)) as this_week,
      count(*) filter (
        where completed_at >= (select prev_week_start from bounds) and completed_at < (select week_start from bounds)
      ) as last_week,
      count(*) filter (where completed_at >= (select month_start from bounds)) as last_30,
      count(*) filter (
        where completed_at >= (select prev_month_start from bounds)
          and completed_at < (select month_start from bounds)
      ) as prev_30
    from public.trail_completions
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
    where source = 'qr'
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
  ),
  subscriber_checkins as (
    select
      count(distinct c.user_id) filter (where c.checkin_date >= (select week_start from bounds)) as this_week,
      count(distinct c.user_id) filter (
        where c.checkin_date >= (select prev_week_start from bounds)
          and c.checkin_date < (select week_start from bounds)
      ) as last_week,
      count(distinct c.user_id) filter (where c.checkin_date >= (select month_start from bounds)) as last_30,
      count(distinct c.user_id) filter (
        where c.checkin_date >= (select prev_month_start from bounds)
          and c.checkin_date < (select month_start from bounds)
      ) as prev_30
    from public.checkins c
    join public.profiles p on p.id = c.user_id
    where p.is_subscriber
  )
  select 'new_accounts', accounts.this_week::numeric, accounts.last_week::numeric,
    accounts.last_30::numeric, accounts.prev_30::numeric
    from accounts, authorized where authorized.ok
  union all
  select 'checkins', checkins_agg.this_week::numeric, checkins_agg.last_week::numeric,
    checkins_agg.last_30::numeric, checkins_agg.prev_30::numeric
    from checkins_agg, authorized where authorized.ok
  union all
  select 'trail_completions', completions.this_week::numeric, completions.last_week::numeric,
    completions.last_30::numeric, completions.prev_30::numeric
    from completions, authorized where authorized.ok
  union all
  select 'wine_club_clicks', wc.this_week::numeric, wc.last_week::numeric, wc.last_30::numeric, wc.prev_30::numeric
    from wc, authorized where authorized.ok
  union all
  select 'page_views', pv.this_week::numeric, pv.last_week::numeric, pv.last_30::numeric, pv.prev_30::numeric
    from pv, authorized where authorized.ok
  union all
  select 'qr_scans', qr.this_week::numeric, qr.last_week::numeric, qr.last_30::numeric, qr.prev_30::numeric
    from qr, authorized where authorized.ok
  union all
  select 'share_events', se.this_week::numeric, se.last_week::numeric, se.last_30::numeric, se.prev_30::numeric
    from se, authorized where authorized.ok
  union all
  select 'subscriber_guests', subscriber_checkins.this_week::numeric, subscriber_checkins.last_week::numeric,
    subscriber_checkins.last_30::numeric, subscriber_checkins.prev_30::numeric
    from subscriber_checkins, authorized where authorized.ok
$$;
