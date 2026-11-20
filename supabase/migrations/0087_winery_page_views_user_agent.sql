-- Tennessee Wine Trails — migration 0087: bot/staff filtering for
-- winery_page_views, mirroring the home_page_views fix (migration 0081 +
-- application-side filtering in getHomePageViewStats).
--
-- winery_page_views never got either protection home_page_views has: no
-- user_agent column at all (so no way to tell a Facebook/SEO/AI crawler
-- from a real scan), and no exclusion of admin/staff self-visits even
-- though the user_id is right there. This table backs a winery's own free
-- "QR Code Scans" count in the portal and the admin dashboard's
-- page-view/QR-scan stats and trends — all of it was uncorrected crawler
-- + self-visit noise until now.

alter table public.winery_page_views
  add column if not exists user_agent text;

-- Shared bot-signature pattern, kept in sync with isBotUserAgent()
-- (src/lib/bot-detection.ts) and the home_page_views filter.
-- ---------------------------------------------------------------------------
-- winery_qr_scan_count() — the free, portal-visible QR scan count.
-- ---------------------------------------------------------------------------
create or replace function public.winery_qr_scan_count(target_winery_id uuid)
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::integer
  from public.winery_page_views v
  where v.winery_id = target_winery_id
    and v.source = 'qr'
    and (v.user_agent is null or v.user_agent !~* 'bot|crawl|spider|facebookexternalhit|slurp|bingpreview|whatsapp|embedly|preview|headless|nutch|curl|python|aiohttp|nomorevibe|scan|wget|phantom|selenium|puppeteer|okhttp|httpclient|postman|libwww|node-fetch|go-http-client')
    and (v.user_id is null or not exists (
      select 1 from public.profiles p where p.id = v.user_id and (p.is_admin or p.is_staff_account)
    ))
    and (public.is_admin() or public.is_winery_staff_for(target_winery_id));
$$;

-- ---------------------------------------------------------------------------
-- winery_conversion_stats() — the paid analytics bundle's page_views/
-- qr_scans counts. This function's return columns were extended several
-- times (migrations 0051 → 0052 → 0054 → 0064); this matches 0064's live
-- 7-column signature exactly and only changes the page_views/qr_scans
-- subqueries' WHERE clauses, so create or replace is safe here (the
-- column set itself isn't changing).
-- ---------------------------------------------------------------------------
create or replace function public.winery_conversion_stats(target_winery_id uuid)
returns table (
  page_views integer,
  checkins integer,
  wine_club_clicks integer,
  avg_visitor_age numeric,
  share_events integer,
  subscriber_guests integer,
  qr_scans integer
)
language sql
security definer
set search_path = public
stable
as $$
  select
    (
      select count(*)::integer from public.winery_page_views v
      where v.winery_id = target_winery_id
        and (v.user_agent is null or v.user_agent !~* 'bot|crawl|spider|facebookexternalhit|slurp|bingpreview|whatsapp|embedly|preview|headless|nutch|curl|python|aiohttp|nomorevibe|scan|wget|phantom|selenium|puppeteer|okhttp|httpclient|postman|libwww|node-fetch|go-http-client')
        and (v.user_id is null or not exists (
          select 1 from public.profiles p where p.id = v.user_id and (p.is_admin or p.is_staff_account)
        ))
    ),
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
    ),
    (
      select count(*)::integer from public.winery_page_views v
      where v.winery_id = target_winery_id and v.source = 'qr'
        and (v.user_agent is null or v.user_agent !~* 'bot|crawl|spider|facebookexternalhit|slurp|bingpreview|whatsapp|embedly|preview|headless|nutch|curl|python|aiohttp|nomorevibe|scan|wget|phantom|selenium|puppeteer|okhttp|httpclient|postman|libwww|node-fetch|go-http-client')
        and (v.user_id is null or not exists (
          select 1 from public.profiles p where p.id = v.user_id and (p.is_admin or p.is_staff_account)
        ))
    )
  where public.is_admin() or public.is_winery_staff_for(target_winery_id);
$$;

-- ---------------------------------------------------------------------------
-- winery_period_trends() — the portal's own "QR Code Scans"/"Page Views"
-- stat cards (what a winery owner actually sees as proof of engagement) —
-- same filter added to the qr/pv CTEs only; everything else unchanged.
-- ---------------------------------------------------------------------------
create or replace function public.winery_period_trends(target_winery_id uuid)
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
      and (user_agent is null or user_agent !~* 'bot|crawl|spider|facebookexternalhit|slurp|bingpreview|whatsapp|embedly|preview|headless|nutch|curl|python|aiohttp|nomorevibe|scan|wget|phantom|selenium|puppeteer|okhttp|httpclient|postman|libwww|node-fetch|go-http-client')
      and (user_id is null or not exists (
        select 1 from public.profiles p where p.id = winery_page_views.user_id and (p.is_admin or p.is_staff_account)
      ))
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
      and (user_agent is null or user_agent !~* 'bot|crawl|spider|facebookexternalhit|slurp|bingpreview|whatsapp|embedly|preview|headless|nutch|curl|python|aiohttp|nomorevibe|scan|wget|phantom|selenium|puppeteer|okhttp|httpclient|postman|libwww|node-fetch|go-http-client')
      and (user_id is null or not exists (
        select 1 from public.profiles p where p.id = winery_page_views.user_id and (p.is_admin or p.is_staff_account)
      ))
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

-- ---------------------------------------------------------------------------
-- admin_period_trends() — add the same filter to the pv/qr CTEs only;
-- every other metric is unchanged from migration 0082.
-- ---------------------------------------------------------------------------
create or replace function public.admin_period_trends()
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
    where is_staff_account = false and is_admin = false
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
    where (user_agent is null or user_agent !~* 'bot|crawl|spider|facebookexternalhit|slurp|bingpreview|whatsapp|embedly|preview|headless|nutch|curl|python|aiohttp|nomorevibe|scan|wget|phantom|selenium|puppeteer|okhttp|httpclient|postman|libwww|node-fetch|go-http-client')
      and (user_id is null or not exists (
        select 1 from public.profiles p where p.id = winery_page_views.user_id and (p.is_admin or p.is_staff_account)
      ))
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
      and (user_agent is null or user_agent !~* 'bot|crawl|spider|facebookexternalhit|slurp|bingpreview|whatsapp|embedly|preview|headless|nutch|curl|python|aiohttp|nomorevibe|scan|wget|phantom|selenium|puppeteer|okhttp|httpclient|postman|libwww|node-fetch|go-http-client')
      and (user_id is null or not exists (
        select 1 from public.profiles p where p.id = winery_page_views.user_id and (p.is_admin or p.is_staff_account)
      ))
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

-- ---------------------------------------------------------------------------
-- admin_daily_trends() — same filter added to the pv/qr left joins only;
-- every other metric is unchanged from migration 0082.
-- ---------------------------------------------------------------------------
create or replace function public.admin_daily_trends()
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
      on p.created_at::date = d.day and p.is_staff_account = false and p.is_admin = false
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
    left join public.winery_page_views v
      on v.created_at::date = d.day
      and (v.user_agent is null or v.user_agent !~* 'bot|crawl|spider|facebookexternalhit|slurp|bingpreview|whatsapp|embedly|preview|headless|nutch|curl|python|aiohttp|nomorevibe|scan|wget|phantom|selenium|puppeteer|okhttp|httpclient|postman|libwww|node-fetch|go-http-client')
      and (v.user_id is null or not exists (
        select 1 from public.profiles p where p.id = v.user_id and (p.is_admin or p.is_staff_account)
      ))
    group by d.day
  ),
  qr as (
    select d.day, count(v.id) as value
    from days d
    left join public.winery_page_views v
      on v.created_at::date = d.day
      and v.source = 'qr'
      and (v.user_agent is null or v.user_agent !~* 'bot|crawl|spider|facebookexternalhit|slurp|bingpreview|whatsapp|embedly|preview|headless|nutch|curl|python|aiohttp|nomorevibe|scan|wget|phantom|selenium|puppeteer|okhttp|httpclient|postman|libwww|node-fetch|go-http-client')
      and (v.user_id is null or not exists (
        select 1 from public.profiles p where p.id = v.user_id and (p.is_admin or p.is_staff_account)
      ))
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
