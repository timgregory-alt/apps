-- Tennessee Wine Passport — Founding Trail seed data
-- Run after schema.sql and policies.sql. Safe to re-run (upserts on slug).

insert into public.trails (name, slug, description, active)
values (
  'Tennessee Wine Passport — Founding Trail',
  'founding-trail',
  'The original four stops of the Tennessee Wine Passport: a countryside tour through Middle Tennessee''s boutique wineries.',
  true
)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  active = excluded.active;

insert into public.wineries (
  name, slug, city, state, address, latitude, longitude,
  description, website_url, wine_club_url, wine_club_title, wine_club_description,
  wine_club_benefits, hours, checkin_radius_meters, active, sort_order
) values
  (
    'Arrington Vineyards', 'arrington-vineyards', 'Arrington', 'Tennessee',
    '6211 Patton Rd, Arrington, TN 37014', 35.7623, -86.6614,
    'Rolling hillside vineyards in the heart of Williamson County, known for relaxed picnic-style tastings and live music among the vines.',
    'https://arringtonvineyards.com', 'https://arringtonvineyards.com/wine-club',
    'Uncorked Club', 'A quarterly taste of what''s new in the barrel room, delivered to your door.',
    array['Exclusive small-batch releases', 'Member-only events on the hillside', 'Preferred member pricing', 'Discounts on bottle purchases'],
    'Mon–Sat 11am–9pm · Sun 12pm–6pm (placeholder — confirm seasonal hours)',
    228, true, 1
  ),
  (
    'Woodfeather Farm Vineyard & Winery', 'woodfeather-farm', 'Chapel Hill', 'Tennessee',
    'Chapel Hill, TN', 35.6337, -86.6903,
    'A working family farm turned vineyard, pouring estate wines with a warm, unhurried farmhouse welcome.',
    null, null, 'Woodfeather Wine Club', 'Take a little of Woodfeather home with you, season after season.',
    array['Exclusive releases', 'Member events', 'Member pricing', 'Bottle discounts'],
    'Fri–Sun 12pm–6pm (placeholder — confirm seasonal hours)',
    228, true, 2
  ),
  (
    'Picker''s Creek Winery', 'pickers-creek', 'Lewisburg', 'Tennessee',
    'Lewisburg, TN', 35.4495, -86.7911,
    'A creekside tasting room pouring approachable Southern wines, named for the old cotton-picking trails that once crossed the property.',
    null, null, 'Creekside Club', 'Seasonal pours and member-first access, straight from the creek.',
    array['Exclusive releases', 'Member events', 'Member pricing', 'Bottle discounts'],
    'Thu–Sun 12pm–7pm (placeholder — confirm seasonal hours)',
    228, true, 3
  ),
  (
    'Grinder''s Switch Winery', 'grinders-switch', 'Columbia', 'Tennessee',
    '510 North Garden Street, Suite D, Columbia, TN 38401', 35.6151, -87.0353,
    'Named for the historic rail switch that once ran through Hickman County, this Maury County tasting lounge — set in a converted 1950s tire shop — pours bold reds in a warm, unpretentious setting.',
    null, null, 'Switch Club', 'Members-first access to limited releases and barrel picks.',
    array['Exclusive releases', 'Member events', 'Member pricing', 'Bottle discounts'],
    'Fri–Sun 12pm–6pm (placeholder — confirm seasonal hours)',
    228, true, 4
  )
on conflict (slug) do update set
  name = excluded.name,
  city = excluded.city,
  address = excluded.address,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  description = excluded.description,
  wine_club_title = excluded.wine_club_title,
  wine_club_description = excluded.wine_club_description,
  wine_club_benefits = excluded.wine_club_benefits,
  hours = excluded.hours,
  checkin_radius_meters = excluded.checkin_radius_meters,
  sort_order = excluded.sort_order;

insert into public.trail_wineries (trail_id, winery_id, display_order)
select t.id, w.id, w.sort_order
from public.trails t
join public.wineries w on w.slug in (
  'arrington-vineyards', 'woodfeather-farm', 'pickers-creek', 'grinders-switch'
)
where t.slug = 'founding-trail'
on conflict (trail_id, winery_id) do update set display_order = excluded.display_order;
