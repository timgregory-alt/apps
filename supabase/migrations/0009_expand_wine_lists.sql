-- Tennessee Wine Passport — migration 0009: expand wine lists beyond the
-- initial 5-per-winery flight, using each winery's real published wine
-- list. Only wines with genuine, sourced tasting-note text are included —
-- some wineries (Picker's Creek, Woodfeather Farm) offer more wines than
-- could be confidently verified here; the weekly automatic sync will pick
-- up the rest over time as it reads each site directly.
--
-- Also fills in website_url for wineries that didn't have one yet, and
-- wine_menu_url so the automatic sync checks the right page.

update public.wineries set website_url = 'https://www.woodfeatherfarm.com', wine_menu_url = 'https://www.woodfeatherfarm.com/shop/'
where slug = 'woodfeather-farm' and website_url is null;

update public.wineries set website_url = 'https://www.pickerscreekwinery.com', wine_menu_url = 'https://www.pickerscreekwinery.com/wines/'
where slug = 'pickers-creek' and website_url is null;

update public.wineries set website_url = 'https://gswinery.com', wine_menu_url = 'https://gswinery.com/our-wines/'
where slug = 'grinders-switch' and website_url is null;

insert into public.wines (winery_id, name, slug, varietal, style, tasting_notes, food_pairing, sort_order)
select w.id, v.name, v.slug, v.varietal, v.style, v.tasting_notes, v.food_pairing, v.sort_order
from public.wineries w
join (
  values
    ('arrington-vineyards', 'Viognier', 'arrington-viognier', 'Viognier', 'white', 'Pale yellow in color, with aromas of white peach and mango, and flavors of ripe pear, nectarine, and lime zest.', null, 6),
    ('arrington-vineyards', 'Honeysuckle', 'arrington-honeysuckle', 'Gewürztraminer', 'sweet', 'Pale yellow with an aroma of honeysuckle flower, and flavors of honey and dried apricot.', null, 7),
    ('arrington-vineyards', 'Stag''s White', 'arrington-stags-white', 'Chardonnay, Vidal Blanc, Albariño & Viognier', 'white', 'Dry and pale golden yellow, with aromas of honey and white peach, and flavors of green apple, white nectarine, and Meyer lemon.', 'Fish, chicken, salads, creamy pastas, or ceviche', 8),
    ('arrington-vineyards', 'Sparkle Blanc', 'arrington-sparkle-blanc', 'Sparkling White Blend', 'sparkling', 'Classic, crisp, and dry, with notes of flowers, Asian pears, lemon, and green apple.', null, 9),
    ('arrington-vineyards', 'Firefly Rosé', 'arrington-firefly-rose', 'Rosé Blend', 'rose', 'Dry but fruit-forward, with a fresh strawberry aroma and flavors of white cherry and lime zest.', null, 10),
    ('arrington-vineyards', 'Sparkle Rosé', 'arrington-sparkle-rose', 'Sparkling Rosé', 'sparkling', 'Refreshing, fruit-forward, and dry, with a strawberry-rhubarb jam aroma and flavors of cherry and lime.', null, 11),
    ('arrington-vineyards', 'Russell Merlot', 'arrington-russell-merlot', 'Merlot', 'red', 'Dark ruby in color, with a juicy blackberry flavor.', null, 12),
    ('arrington-vineyards', 'Pinot Noir', 'arrington-pinot-noir', 'Pinot Noir & Noiret', 'red', 'Medium-bodied and dry, with aromas of black tea and earthy spice, and flavors of black pepper, black raspberry, and wild herbs.', 'Herb-crusted lamb, roast duck, roasted chicken, charcuterie, or mushroom risotto', 13),
    ('arrington-vineyards', 'Petite Noir', 'arrington-petite-noir', 'Pinot Noir-Style Red Blend', 'red', 'Light-bodied and elegant, with aromas of cherry cola and baking spices, and flavors of raspberry pie and vanilla oak.', null, 14),
    ('arrington-vineyards', 'Encore', 'arrington-encore', 'Estate Chambourcin', 'sweet', 'Rich and Port-style, very dark ruby, with an aroma of brown sugar and butterscotch, and flavors of Luxardo cherries and sweet brown butter.', 'Blue cheese or chocolate desserts', 15),
    ('arrington-vineyards', 'Blackberry', 'arrington-blackberry', 'Marion Blackberry', 'sweet', 'Aromas of blackberry cobbler and blackberry preserves, with a rich blackberry flavor and a long, sweet finish.', 'Chocolate desserts or vanilla bean ice cream', 16),
    ('arrington-vineyards', 'Sweet Blues', 'arrington-sweet-blues', 'Blueberry & Blackberry Blend', 'sweet', 'Dark purple, with a blueberry jam aroma and flavors of juicy, tart blackberries.', 'Cheesecake or grilled pork tenderloin', 17),
    ('grinders-switch', 'Cou Rouge', 'grinders-switch-cou-rouge', 'Blush Blend', 'sweet', 'A bright, fruity blush wine with a gentle touch of tartness — refreshingly crisp on warm days.', null, 6),
    ('grinders-switch', 'Cran-Merry', 'grinders-switch-cran-merry', 'Cranberry Blend', 'sweet', 'Bursts with bright cranberry flavor, balanced between tartness and sweetness.', null, 7),
    ('grinders-switch', 'The General 1', 'grinders-switch-the-general-1', 'Estate Carlos Muscadine', 'sweet', 'A sweet, white estate-grown muscadine wine.', null, 8),
    ('grinders-switch', 'The General 2', 'grinders-switch-the-general-2', 'Estate Noble Muscadine', 'sweet', 'A sweet, earthy red muscadine wine with a thick mouthfeel and floral notes.', null, 9),
    ('grinders-switch', 'Marathon', 'grinders-switch-marathon', 'Elderberry', 'sweet', 'A sweet red elderberry wine.', null, 10),
    ('pickers-creek', 'Moondance', 'pickers-creek-moondance', 'Muscat', 'sweet', 'A sweet white wine with a subtle honeysuckle aroma and undertones of citrus, pear, and honey.', null, 6)
) as v(winery_slug, name, slug, varietal, style, tasting_notes, food_pairing, sort_order)
  on v.winery_slug = w.slug
on conflict (slug) do update set
  name = excluded.name,
  varietal = excluded.varietal,
  style = excluded.style,
  tasting_notes = excluded.tasting_notes,
  food_pairing = excluded.food_pairing,
  sort_order = excluded.sort_order;
