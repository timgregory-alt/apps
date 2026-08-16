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

-- A small tasting flight per winery, spread across red/white/rosé/sweet so
-- the "wines you liked" recommendations have a real signal to work with.
insert into public.wines (winery_id, name, slug, varietal, style, tasting_notes, sort_order)
select w.id, v.name, v.slug, v.varietal, v.style, v.tasting_notes, v.sort_order
from public.wineries w
join (
  values
    ('arrington-vineyards', 'Stony Ridge Cabernet Sauvignon', 'stony-ridge-cabernet-sauvignon', 'Cabernet Sauvignon', 'red', 'Bold and structured, with dark cherry, cedar, and a firm tannic finish. A wine built for a hillside sunset.', 1),
    ('arrington-vineyards', 'Hillside Chardonnay', 'hillside-chardonnay', 'Chardonnay', 'white', 'Lightly oaked with notes of baked pear, vanilla, and a soft, buttery finish.', 2),
    ('woodfeather-farm', 'Farmhouse Rosé', 'farmhouse-rose', 'Rosé', 'rose', 'Crisp and dry, with bright strawberry and watermelon rind. Porch-sipping, any season.', 1),
    ('woodfeather-farm', 'Estate Merlot', 'estate-merlot', 'Merlot', 'red', 'Soft and approachable, with plum, cocoa, and gentle tannins — an easy, everyday red.', 2),
    ('pickers-creek', 'Creekside Riesling', 'creekside-riesling', 'Riesling', 'sweet', 'Off-dry and floral, with ripe peach and a honeyed finish. A warm-afternoon favorite.', 1),
    ('pickers-creek', 'Cotton Trail Red Blend', 'cotton-trail-red-blend', 'Red Blend', 'red', 'Jammy and medium-bodied, blending blackberry and a whisper of black pepper spice.', 2),
    ('grinders-switch', 'Rail Switch Cabernet', 'rail-switch-cabernet', 'Cabernet Sauvignon', 'red', 'Full-bodied and dark, with blackcurrant, tobacco, and a long, smoky finish.', 1),
    ('grinders-switch', 'Depot Muscadine', 'depot-muscadine', 'Muscadine', 'sweet', 'A true Southern classic — lush, sweet, and full of ripe muscadine grape and honeysuckle.', 2)
) as v(winery_slug, name, slug, varietal, style, tasting_notes, sort_order)
  on v.winery_slug = w.slug
on conflict (slug) do update set
  name = excluded.name,
  varietal = excluded.varietal,
  style = excluded.style,
  tasting_notes = excluded.tasting_notes,
  sort_order = excluded.sort_order;
