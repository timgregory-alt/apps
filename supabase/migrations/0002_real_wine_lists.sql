-- Tennessee Wine Passport — migration 0002: replace invented wine names
-- with each winery's real, published wine list.
--
-- Run this once in the Supabase SQL editor if you already ran
-- migration 0001. It deletes the 8 placeholder wines (Stony Ridge
-- Cabernet Sauvignon, Hillside Chardonnay, etc.) and inserts the real
-- replacements. If anyone has already rated one of the old placeholder
-- wines, that rating is deleted along with it (wine_tastings cascades on
-- wine deletion) — low-stakes this early on, but worth knowing.

delete from public.wines where slug in (
  'stony-ridge-cabernet-sauvignon',
  'hillside-chardonnay',
  'farmhouse-rose',
  'estate-merlot',
  'creekside-riesling',
  'cotton-trail-red-blend',
  'rail-switch-cabernet',
  'depot-muscadine'
);

insert into public.wines (winery_id, name, slug, varietal, style, tasting_notes, sort_order)
select w.id, v.name, v.slug, v.varietal, v.style, v.tasting_notes, v.sort_order
from public.wineries w
join (
  values
    ('arrington-vineyards', 'Scarlet', 'arrington-scarlet', 'Chambourcin', 'rose', 'Arrington''s signature pour: estate-grown Chambourcin pressed rosé-style, with bright red berry and a refreshing, off-dry finish.', 1),
    ('arrington-vineyards', 'Chardonnay', 'arrington-chardonnay', 'Chardonnay', 'white', 'Bright and food-friendly, with green apple, citrus, and a clean, crisp finish.', 2),
    ('woodfeather-farm', 'Working Dog', 'woodfeather-working-dog', 'Red Blend', 'red', 'A bourbon barrel-aged red with dark fruit, vanilla, and toasted oak — as sturdy as its name.', 1),
    ('woodfeather-farm', 'Terrier Rosato', 'woodfeather-terrier-rosato', 'Rosato', 'rose', 'A dry, food-friendly rosato with strawberry and citrus zest, built for the porch.', 2),
    ('pickers-creek', 'Harmony', 'pickers-creek-harmony', 'Chambourcin & Cabernet Sauvignon', 'red', 'A Chambourcin and Cabernet Sauvignon blend — dark berry fruit with soft, easy-drinking tannins.', 1),
    ('pickers-creek', 'Give Peach a Chance', 'pickers-creek-give-peach-a-chance', 'Peach', 'sweet', 'A playful, sun-ripened peach wine — juicy and sweet with a nostalgic, fruit-stand finish.', 2),
    ('grinders-switch', 'Cabernet Sauvignon', 'grinders-switch-cabernet-sauvignon', 'Cabernet Sauvignon', 'red', 'Bold and dry, with gripping tannins, leather, orange peel, and a hint of cracked pepper.', 1),
    ('grinders-switch', 'Honeysuckle Rose', 'grinders-switch-honeysuckle-rose', 'Blush Blend', 'sweet', 'A gold medal-winning sweet blush, perfumed with honeysuckle and ripe stone fruit.', 2)
) as v(winery_slug, name, slug, varietal, style, tasting_notes, sort_order)
  on v.winery_slug = w.slug
on conflict (slug) do update set
  name = excluded.name,
  varietal = excluded.varietal,
  style = excluded.style,
  tasting_notes = excluded.tasting_notes,
  sort_order = excluded.sort_order;
