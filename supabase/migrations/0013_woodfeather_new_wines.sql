-- Tennessee Wine Passport — migration 0013:
--   1. Adds "mead" as a wine style, for Woodfeather Farm's honey wines.
--   2. Adds the 6 Woodfeather Farm wines the automatic sync couldn't find
--      (Lagotto Romagnolo, Coyote Jack, Blue Heeler, Maltese Bianco,
--      Wolfhound Mead, Wolfhound Dark), sourced from their retailer
--      listing pages. Blue Heeler and Wolfhound Mead are sold out.
--   3. Resets every wine's created_at to a fixed past date so this
--      backfill doesn't trigger the "New" badge — only wines added from
--      here forward (by the weekly sync or an admin) should show New.

alter table public.wines drop constraint if exists wines_style_check;
alter table public.wines
  add constraint wines_style_check
  check (style in ('red', 'white', 'rose', 'sweet', 'sparkling', 'mead'));

insert into public.wines (winery_id, name, slug, varietal, style, tasting_notes, food_pairing, sold_out, sort_order)
select w.id, v.name, v.slug, v.varietal, v.style, v.tasting_notes, v.food_pairing, v.sold_out, v.sort_order
from public.wineries w
join (
  values
    ('woodfeather-farm', 'Lagotto Romagnolo', 'woodfeather-lagotto-romagnolo', 'Niagara & Enchantment Blend', 'rose', 'Crafted from Tennessee Niagara and Enchantment, this rosé reflects the lively Lagotto Romagnolo — bright strawberry and melon with soft citrus and a hint of wildflower. Energetic, charming, and subtly earthy.', null, false, 6),
    ('woodfeather-farm', 'Coyote Jack', 'woodfeather-coyote-jack', 'Apple', 'sweet', 'Aged in a freshly emptied Leiper''s Fork whiskey barrel, this apple wine channels the untamed spirit of the coyote and the legacy of early applejack. Crisp orchard apple deepens into caramel, spice, and toasted oak, finishing smooth and warm.', null, false, 7),
    ('woodfeather-farm', 'Blue Heeler Blueberry Dessert Wine', 'woodfeather-blue-heeler', 'Blueberry & Blueberry Brandy Blend', 'sweet', 'Like the loyal Blue Heeler it honors, this Tennessee dessert wine is bold yet balanced — a blend of estate blueberry wine and distilled blueberry brandy crafted with Leiper''s Fork Distillery. Lush blueberry meets warm spirit and oak, finishing slightly sweet with a smooth, lingering finesse.', null, true, 8),
    ('woodfeather-farm', 'Maltese Bianco', 'woodfeather-maltese-bianco', 'Vidal Blanc & Niagara Blend', 'white', 'Born from a Tennessee blend of Vidal Blanc and Niagara, this wine reflects the delicate charm of the Maltese — soft florals, crisp orchard fruit, and hints of peach, citrus, and honey. Clean, lively, and smooth.', null, false, 9),
    ('woodfeather-farm', 'Wolfhound Mead', 'woodfeather-wolfhound-mead', 'Honey', 'mead', 'A honey mead from Woodfeather Farm.', null, true, 10),
    ('woodfeather-farm', 'Wolfhound Dark — Coffee-Infused Honey Wine', 'woodfeather-wolfhound-dark', 'Honey', 'mead', 'A coffee-infused honey wine from Woodfeather Farm.', null, false, 11)
) as v(winery_slug, name, slug, varietal, style, tasting_notes, food_pairing, sold_out, sort_order)
  on v.winery_slug = w.slug
on conflict (slug) do update set
  name = excluded.name,
  varietal = excluded.varietal,
  style = excluded.style,
  tasting_notes = excluded.tasting_notes,
  food_pairing = excluded.food_pairing,
  sold_out = excluded.sold_out,
  sort_order = excluded.sort_order;

update public.wines set created_at = '2026-01-01T00:00:00.000Z';
