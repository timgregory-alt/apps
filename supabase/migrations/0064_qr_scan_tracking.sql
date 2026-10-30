-- Tennessee Wine Trails — migration 0064: QR scan tracking.
--
-- The tasting-room QR code just linked to the winery page like any other
-- visit, so a scan was indistinguishable from someone finding the page
-- any other way. Each winery's QR code (portal + admin) now appends
-- ?src=qr, and the page-view logger records it — letting winery staff see
-- how many of their page views actually came from someone scanning the
-- code on-site.

alter table public.winery_page_views add column if not exists source text;

-- Postgres won't let CREATE OR REPLACE change a function's output columns
-- (adding qr_scans counts as changing the return type) — drop it first.
drop function if exists public.winery_conversion_stats(uuid);

create function public.winery_conversion_stats(target_winery_id uuid)
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
    ),
    (
      select count(*)::integer from public.winery_page_views
      where winery_id = target_winery_id and source = 'qr'
    )
  where public.is_admin() or public.is_winery_staff_for(target_winery_id);
$$;
