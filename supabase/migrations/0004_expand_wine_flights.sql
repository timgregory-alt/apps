-- Tennessee Wine Passport — migration 0004: expand each winery's tasting
-- flight from 2 wines to 5, still drawn from each winery's real published
-- wine list. Purely additive (upsert by slug) — safe to run more than once.

insert into public.wines (winery_id, name, slug, varietal, style, tasting_notes, sort_order)
select w.id, v.name, v.slug, v.varietal, v.style, v.tasting_notes, v.sort_order
from public.wineries w
join (
  values
    ('arrington-vineyards', 'Riesling', 'arrington-riesling', 'Riesling', 'sweet', 'Off-dry and floral, with ripe stone fruit and a crisp mineral finish.', 3),
    ('arrington-vineyards', 'Cabernet Sauvignon', 'arrington-cabernet-sauvignon', 'Cabernet Sauvignon', 'red', 'Structured and dry, with dark currant, cedar, and firm tannins.', 4),
    ('arrington-vineyards', 'Red Fox Red', 'arrington-red-fox-red', 'Sangiovese, Petit Verdot & Chambourcin', 'red', 'A bold field blend of Sangiovese, Petit Verdot, and Chambourcin, rounded out with a whisper of Viognier.', 5),
    ('woodfeather-farm', 'Papillon Blanc', 'woodfeather-papillon-blanc', 'White Blend', 'white', 'Oak-aged and elegant, with baked apple, vanilla, and a rounded, creamy finish.', 3),
    ('woodfeather-farm', 'Herding Dog Red Blend', 'woodfeather-herding-dog-red-blend', 'Red Blend', 'red', 'An easy-drinking red blend of estate varietals, soft tannins and ripe berry fruit.', 4),
    ('woodfeather-farm', 'Sporting Dog', 'woodfeather-sporting-dog', 'Red Blend', 'red', 'Oak-aged and full-bodied, with dark fruit, baking spice, and a long, smoky finish.', 5),
    ('pickers-creek', 'Three Dog White', 'pickers-creek-three-dog-white', 'White Blend', 'white', 'A crisp, easy-drinking white blend named for the porch dogs who inspired it.', 3),
    ('pickers-creek', 'Rockabilly Red', 'pickers-creek-rockabilly-red', 'Muscadine', 'sweet', 'Made from Southern muscadine grapes — sweet, musky, and full of old-school Tennessee character.', 4),
    ('pickers-creek', 'Blackberry Blues', 'pickers-creek-blackberry-blues', 'Blackberry', 'sweet', 'A jammy blackberry fruit wine, deep purple and sweet down to the last sip.', 5),
    ('grinders-switch', 'Switch Red', 'grinders-switch-switch-red', 'Concord', 'sweet', 'The best-seller: a sweet Concord red, juicy and jam-forward — welcome-mat wine.', 3),
    ('grinders-switch', 'Blondy', 'grinders-switch-blondy', 'White Blend', 'sweet', 'A gold medal sweet white, honeyed and smooth.', 4),
    ('grinders-switch', 'Blackberry Express', 'grinders-switch-blackberry-express', 'Blackberry', 'sweet', 'A sweet blackberry fruit wine, bursting with ripe bramble and a syrupy finish.', 5)
) as v(winery_slug, name, slug, varietal, style, tasting_notes, sort_order)
  on v.winery_slug = w.slug
on conflict (slug) do update set
  name = excluded.name,
  varietal = excluded.varietal,
  style = excluded.style,
  tasting_notes = excluded.tasting_notes,
  sort_order = excluded.sort_order;
