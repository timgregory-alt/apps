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
    'Mon–Thu 11am–8pm · Fri 11am–9pm · Sat 11am–8pm · Sun 12pm–8pm (Apr–Oct; shorter hours Nov–Mar)',
    228, true, 1
  ),
  (
    'Woodfeather Farm Vineyard & Winery', 'woodfeather-farm', 'Chapel Hill', 'Tennessee',
    '106 N Horton Pkwy, Chapel Hill, TN 37034', 35.6337, -86.6903,
    'A working family farm turned vineyard, pouring estate wines with a warm, unhurried farmhouse welcome.',
    null, null, 'Woodfeather Wine Club', 'Take a little of Woodfeather home with you, season after season.',
    array['Exclusive releases', 'Member events', 'Member pricing', 'Bottle discounts'],
    'Closed Mon–Wed · Thu 2pm–8pm · Fri–Sat 1pm–9pm · Sun 1pm–6pm',
    228, true, 2
  ),
  (
    'Picker''s Creek Winery', 'pickers-creek', 'Lewisburg', 'Tennessee',
    '1986 New Columbia Hwy, Lewisburg, TN 37091', 35.4495, -86.7911,
    'A creekside tasting room pouring approachable Southern wines, named for the old cotton-picking trails that once crossed the property.',
    null, null, 'Creekside Club', 'Seasonal pours and member-first access, straight from the creek.',
    array['Exclusive releases', 'Member events', 'Member pricing', 'Bottle discounts'],
    'Closed Mon–Thu · Fri 11am–8pm (until 9pm w/ live music) · Sat 11am–9pm · Sun 12pm–6pm',
    228, true, 3
  ),
  (
    'Grinder''s Switch Winery', 'grinders-switch', 'Columbia', 'Tennessee',
    '510 North Garden Street, Suite D, Columbia, TN 38401', 35.6151, -87.0353,
    'Named for the historic rail switch that once ran through Hickman County, this Maury County tasting lounge — set in a converted 1950s tire shop — pours bold reds in a warm, unpretentious setting.',
    null, null, 'Switch Club', 'Members-first access to limited releases and barrel picks.',
    array['Exclusive releases', 'Member events', 'Member pricing', 'Bottle discounts'],
    'Closed Mon · Tue–Fri 3pm–8pm · Sat 11am–7pm · Sun 1pm–7pm',
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

-- A small tasting flight per winery, drawn from each winery's actual
-- published wine names where publicly available (Arrington, Picker's Creek,
-- Grinder's Switch). Woodfeather Farm doesn't list specific bottle names
-- publicly, so its two wines are named for the real grape varieties they
-- grow instead of an invented brand name.
insert into public.wines (winery_id, name, slug, varietal, style, tasting_notes, food_pairing, sort_order)
select w.id, v.name, v.slug, v.varietal, v.style, v.tasting_notes, v.food_pairing, v.sort_order
from public.wineries w
join (
  values
    ('arrington-vineyards', 'Scarlet', 'arrington-scarlet', 'Chambourcin', 'rose', 'Arrington''s signature pour: estate-grown Chambourcin pressed rosé-style, with bright red berry and a refreshing, off-dry finish.', 'Grilled salmon or a summer charcuterie board', 1),
    ('arrington-vineyards', 'Chardonnay', 'arrington-chardonnay', 'Chardonnay', 'white', 'Bright and food-friendly, with green apple, citrus, and a clean, crisp finish.', 'Roast chicken or creamy pasta', 2),
    ('arrington-vineyards', 'Riesling', 'arrington-riesling', 'Riesling', 'sweet', 'Off-dry and floral, with ripe stone fruit and a crisp mineral finish.', 'Spicy Thai food or a fruit tart', 3),
    ('arrington-vineyards', 'Cabernet Sauvignon', 'arrington-cabernet-sauvignon', 'Cabernet Sauvignon', 'red', 'Structured and dry, with dark currant, cedar, and firm tannins.', 'Grilled steak or aged cheddar', 4),
    ('arrington-vineyards', 'Red Fox Red', 'arrington-red-fox-red', 'Sangiovese, Petit Verdot & Chambourcin', 'red', 'A bold field blend of Sangiovese, Petit Verdot, and Chambourcin, rounded out with a whisper of Viognier.', 'Braised short ribs or a hearty stew', 5),
    ('woodfeather-farm', 'Working Dog', 'woodfeather-working-dog', 'Red Blend', 'red', 'A bourbon barrel-aged red with dark fruit, vanilla, and toasted oak — as sturdy as its name.', 'Smoked brisket or dark chocolate', 1),
    ('woodfeather-farm', 'Terrier Rosato', 'woodfeather-terrier-rosato', 'Rosato', 'rose', 'A dry, food-friendly rosato with strawberry and citrus zest, built for the porch.', 'Goat cheese salad or grilled shrimp', 2),
    ('woodfeather-farm', 'Papillon Blanc', 'woodfeather-papillon-blanc', 'White Blend', 'white', 'Oak-aged and elegant, with baked apple, vanilla, and a rounded, creamy finish.', 'Roast pork or buttered lobster', 3),
    ('woodfeather-farm', 'Herding Dog Red Blend', 'woodfeather-herding-dog-red-blend', 'Red Blend', 'red', 'An easy-drinking red blend of estate varietals, soft tannins and ripe berry fruit.', 'Burgers or a charcuterie board', 4),
    ('woodfeather-farm', 'Sporting Dog', 'woodfeather-sporting-dog', 'Red Blend', 'red', 'Oak-aged and full-bodied, with dark fruit, baking spice, and a long, smoky finish.', 'Barbecue ribs or smoked gouda', 5),
    ('pickers-creek', 'Harmony', 'pickers-creek-harmony', 'Chambourcin & Cabernet Sauvignon', 'red', 'A Chambourcin and Cabernet Sauvignon blend — dark berry fruit with soft, easy-drinking tannins.', 'Pulled pork or grilled sausage', 1),
    ('pickers-creek', 'Give Peach a Chance', 'pickers-creek-give-peach-a-chance', 'Peach', 'sweet', 'A playful, sun-ripened peach wine — juicy and sweet with a nostalgic, fruit-stand finish.', 'Vanilla ice cream or a cheese plate', 2),
    ('pickers-creek', 'Three Dog White', 'pickers-creek-three-dog-white', 'White Blend', 'white', 'A crisp, easy-drinking white blend named for the porch dogs who inspired it.', 'Fried catfish or a garden salad', 3),
    ('pickers-creek', 'Rockabilly Red', 'pickers-creek-rockabilly-red', 'Muscadine', 'sweet', 'Made from Southern muscadine grapes — sweet, musky, and full of old-school Tennessee character.', 'Barbecue or spicy wings', 4),
    ('pickers-creek', 'Blackberry Blues', 'pickers-creek-blackberry-blues', 'Blackberry', 'sweet', 'A jammy blackberry fruit wine, deep purple and sweet down to the last sip.', 'Dark chocolate or a cheese board', 5),
    ('grinders-switch', 'Cabernet Sauvignon', 'grinders-switch-cabernet-sauvignon', 'Cabernet Sauvignon', 'red', 'Bold and dry, with gripping tannins, leather, orange peel, and a hint of cracked pepper.', 'Grilled steak or sharp cheddar', 1),
    ('grinders-switch', 'Honeysuckle Rose', 'grinders-switch-honeysuckle-rose', 'Blush Blend', 'sweet', 'A gold medal-winning sweet blush, perfumed with honeysuckle and ripe stone fruit.', 'Fresh fruit or a light salad', 2),
    ('grinders-switch', 'Switch Red', 'grinders-switch-switch-red', 'Concord', 'sweet', 'The best-seller: a sweet Concord red, juicy and jam-forward — welcome-mat wine.', 'Barbecue or burgers', 3),
    ('grinders-switch', 'Blondy', 'grinders-switch-blondy', 'White Blend', 'sweet', 'A gold medal sweet white, honeyed and smooth.', 'Baked ham or fruit tart', 4),
    ('grinders-switch', 'Blackberry Express', 'grinders-switch-blackberry-express', 'Blackberry', 'sweet', 'A sweet blackberry fruit wine, bursting with ripe bramble and a syrupy finish.', 'Vanilla cake or dark chocolate', 5)
) as v(winery_slug, name, slug, varietal, style, tasting_notes, food_pairing, sort_order)
  on v.winery_slug = w.slug
on conflict (slug) do update set
  name = excluded.name,
  varietal = excluded.varietal,
  style = excluded.style,
  tasting_notes = excluded.tasting_notes,
  food_pairing = excluded.food_pairing,
  sort_order = excluded.sort_order;

-- Seasonal hours (only Arrington publishes a detailed seasonal schedule;
-- the other three fall back to their plain `hours` field until seasonal
-- rows are added for them via the admin dashboard).
delete from public.winery_hours
where winery_id = (select id from public.wineries where slug = 'arrington-vineyards');

insert into public.winery_hours (winery_id, label, start_month, end_month, hours_text, sort_order)
select w.id, v.label, v.start_month, v.end_month, v.hours_text, v.sort_order
from public.wineries w
cross join (
  values
    ('April – October', 4, 10, 'Mon–Thu 11am–8pm · Fri 11am–9pm · Sat 11am–8pm · Sun 12pm–8pm', 1),
    ('November – December', 11, 12, 'Mon–Sat 11am–8pm · Sun 12pm–6pm', 2),
    ('January – February', 1, 2, 'Mon–Sat 11am–6pm · Sun 12pm–6pm', 3),
    ('March', 3, 3, 'Mon–Thu 11am–7pm · Fri–Sat 11am–8pm · Sun 12pm–7pm', 4)
) as v(label, start_month, end_month, hours_text, sort_order)
where w.slug = 'arrington-vineyards';
