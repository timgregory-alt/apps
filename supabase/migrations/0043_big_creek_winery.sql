-- Tennessee Wine Trails — migration 0043: add Big Creek Winery to the
-- Highland Rim Wine Trail.
--
-- Big Creek Winery (Pulaski, TN — Giles County) sits south of Picker's
-- Creek, roughly a 30-35 minute drive. Beans Creek (Manchester, Coffee
-- County) is the trail's other long leg, ~75-85 minutes from Pulaski with
-- no direct route between them. So the trail now runs as a clockwise sweep
-- rather than a zigzag: Woodfeather -> Picker's Creek (close pair, north
-- to south through Marshall County) -> Big Creek (further south into
-- Giles County) -> Beans Creek (the one long drive east, saved for last).
-- This is now a genuine full-day, ~180+ mile loop — worth saying so
-- plainly in the trail's guest-facing copy.
--
-- Coordinates are a Pulaski town-center approximation (no address-level
-- geocode was available) — replace with the verified tasting-room pin via
-- the admin dashboard before relying on check-in geofencing for this stop.

insert into public.wineries (
  name, slug, city, state, address, latitude, longitude, description,
  hours, phone, website_url, checkin_radius_meters, active, sort_order
)
select
  'Big Creek Winery',
  'big-creek',
  'Pulaski',
  'Tennessee',
  '1900 Crescentview Rd, Pulaski, TN 38478',
  35.1958,
  -87.0344,
  'A Giles County winery crafting more than 30 grape and fruit wines since ' ||
    '2016, many named for local history — tour the winemaking process and ' ||
    'sample in the tasting room, with regular live music and an annual ' ||
    'Spring Jam and AutumnFest.',
  null,
  null,
  'https://bigcreekwinerytennessee.com',
  228,
  true,
  (select coalesce(max(sort_order), 0) + 1 from public.wineries)
where not exists (select 1 from public.wineries where slug = 'big-creek');

-- Beans Creek moves from position 3 to 4 to make room for Big Creek at 3.
update public.trail_wineries
set display_order = 4
where trail_id = (select id from public.trails where slug = 'highland-rim')
  and winery_id = (select id from public.wineries where slug = 'beans-creek');

insert into public.trail_wineries (trail_id, winery_id, display_order)
select t.id, w.id, 3
from public.trails t, public.wineries w
where t.slug = 'highland-rim'
  and w.slug = 'big-creek'
  and not exists (
    select 1 from public.trail_wineries tw where tw.trail_id = t.id and tw.winery_id = w.id
  );

update public.trails
set description = 'A full-day loop through Marshall, Giles, and Coffee County wineries, from the rolling hills south of Nashville down to Pulaski and out to Manchester.'
where slug = 'highland-rim';
