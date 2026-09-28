-- Tennessee Wine Trails — migration 0051: wine club click-through rate.
--
-- The Wine Club section renders on every winery page regardless of
-- check-in status, but winery_page_views (the table that would let us
-- compute "of everyone who viewed this page, how many clicked through")
-- was defined in the schema and never actually written to. This adds the
-- SECURITY DEFINER function winery staff need to read their own
-- page-view/checkin/wine-club-click counts (same pattern as
-- winery_repeat_guest_stats) — the raw tables stay admin-only via RLS,
-- same as before.

create or replace function public.winery_conversion_stats(target_winery_id uuid)
returns table (page_views integer, checkins integer, wine_club_clicks integer)
language sql
security definer
set search_path = public
stable
as $$
  select
    (select count(*)::integer from public.winery_page_views where winery_id = target_winery_id),
    (select count(*)::integer from public.checkins where winery_id = target_winery_id),
    (select count(*)::integer from public.wine_club_clicks where winery_id = target_winery_id)
  where public.is_admin() or public.is_winery_staff_for(target_winery_id);
$$;
