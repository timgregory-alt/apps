-- Tennessee Wine Trails — migration 0042: Highland Rim Wine Trail
--
-- Adds Beans Creek Winery (Manchester, TN — Coffee County) and groups it
-- with Woodfeather Farm and Picker's Creek (both Marshall County) into a
-- new trail, separate from the tight South Nashville cluster. Woodfeather
-- and Picker's Creek are ~20 minutes apart; Beans Creek is 55-70 minutes
-- from either (no direct highway), so this reads as a full-day loop rather
-- than a casual afternoon — display_order below runs Woodfeather ->
-- Picker's Creek -> Beans Creek, i.e. the two close stops first, then the
-- one long drive out, avoiding backtracking over the same road twice.

insert into public.wineries (
  name, slug, city, state, address, latitude, longitude, description,
  hours, phone, website_url, checkin_radius_meters, active, sort_order
)
select
  'Beans Creek Winery',
  'beans-creek',
  'Manchester',
  'Tennessee',
  '426 Ragsdale Rd, Manchester, TN 37355',
  35.4872,
  -86.0695,
  'A family-run winery near I-24''s Exit 111, pouring award-winning wines ' ||
    'from local grapes since 2004 — reds, whites, roses, sparkling, and ' ||
    'fruit wines, served in a cozy tasting room with a full food menu.',
  null,
  '(931) 723-2294',
  'https://beanscreekwinery.com',
  228,
  true,
  (select coalesce(max(sort_order), 0) + 1 from public.wineries)
where not exists (select 1 from public.wineries where slug = 'beans-creek');

insert into public.trails (name, slug, description, active)
select
  'Highland Rim Wine Trail',
  'highland-rim',
  'A full-day loop through Marshall and Coffee County wineries, from the rolling hills south of Nashville out to Manchester.',
  true
where not exists (select 1 from public.trails where slug = 'highland-rim');

insert into public.trail_wineries (trail_id, winery_id, display_order)
select t.id, w.id, v.display_order
from (
  values
    ('woodfeather-farm', 1),
    ('pickers-creek', 2),
    ('beans-creek', 3)
) as v(winery_slug, display_order)
join public.wineries w on w.slug = v.winery_slug
join public.trails t on t.slug = 'highland-rim'
where not exists (
  select 1 from public.trail_wineries tw where tw.trail_id = t.id and tw.winery_id = w.id
);
