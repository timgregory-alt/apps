-- Tennessee Wine Trails — migration 0082: persistent staff-account flag.
--
-- Every "guest member" stat (admin dashboard total, Members page, CSV
-- export, new_accounts trends) filtered on winery_id is null to keep
-- winery-staff accounts out of guest counts. That broke the moment a
-- staff account's portal access was revoked: revoking just nulls out
-- winery_id (see revokeWineryStaffAction), so a former winery-staff
-- account instantly looks like an ordinary guest signup again and starts
-- counting as a "member."
--
-- is_staff_account is set once, the first time a profile is ever granted
-- winery_id, and never reset — so it keeps excluding that profile from
-- guest stats even after access is revoked.

alter table public.profiles
  add column if not exists is_staff_account boolean not null default false;

update public.profiles
  set is_staff_account = true
  where winery_id is not null;

-- ---------------------------------------------------------------------------
-- handle_new_user() — set is_staff_account alongside winery_id for brand-new
-- invited accounts, same validate-then-null-out pattern as migration 0038.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  ref_id uuid;
  target_winery_id uuid;
begin
  begin
    ref_id := nullif(new.raw_user_meta_data ->> 'referred_by', '')::uuid;
  exception when others then
    ref_id := null;
  end;
  if ref_id is not null and not exists (select 1 from public.profiles where id = ref_id) then
    ref_id := null;
  end if;

  begin
    target_winery_id := nullif(new.raw_user_meta_data ->> 'winery_id', '')::uuid;
  exception when others then
    target_winery_id := null;
  end;
  if target_winery_id is not null and not exists (select 1 from public.wineries where id = target_winery_id) then
    target_winery_id := null;
  end if;

  insert into public.profiles (
    id, email, name, birth_date, zip_code, trail_start_date, referred_by, agreed_to_terms_at, winery_id,
    is_staff_account
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data ->> 'birth_date', '')::date,
    nullif(new.raw_user_meta_data ->> 'zip_code', ''),
    now(),
    ref_id,
    case when (new.raw_user_meta_data ->> 'terms_accepted') = 'true' then now() else null end,
    target_winery_id,
    target_winery_id is not null
  )
  on conflict (id) do update set
    winery_id = excluded.winery_id,
    is_staff_account = public.profiles.is_staff_account or excluded.is_staff_account
  where public.profiles.winery_id is null;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- admin_period_trends() / admin_daily_trends() — swap the "winery_id is
-- null" guest filter for "is_staff_account = false" so new_accounts stops
-- counting former staff too. Bodies are otherwise unchanged from migrations
-- 0068 and 0072.
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
