-- Tennessee Wine Passport — migration 0005: food pairing suggestions
--
-- Adds a food_pairing column to both wine tables, then fills in a pairing
-- for each of the 20 curated wines. These are Claude's own pairing
-- recommendations based on each wine's style/varietal — no winery
-- publishes official pairing notes, so treat these as a tasteful starting
-- point, editable later via the admin dashboard. Safe to run more than once.

alter table public.wines add column if not exists food_pairing text;
alter table public.custom_wine_tastings add column if not exists food_pairing text;

update public.wines set food_pairing = v.food_pairing
from (
  values
    ('arrington-scarlet', 'Grilled salmon or a summer charcuterie board'),
    ('arrington-chardonnay', 'Roast chicken or creamy pasta'),
    ('arrington-riesling', 'Spicy Thai food or a fruit tart'),
    ('arrington-cabernet-sauvignon', 'Grilled steak or aged cheddar'),
    ('arrington-red-fox-red', 'Braised short ribs or a hearty stew'),
    ('woodfeather-working-dog', 'Smoked brisket or dark chocolate'),
    ('woodfeather-terrier-rosato', 'Goat cheese salad or grilled shrimp'),
    ('woodfeather-papillon-blanc', 'Roast pork or buttered lobster'),
    ('woodfeather-herding-dog-red-blend', 'Burgers or a charcuterie board'),
    ('woodfeather-sporting-dog', 'Barbecue ribs or smoked gouda'),
    ('pickers-creek-harmony', 'Pulled pork or grilled sausage'),
    ('pickers-creek-give-peach-a-chance', 'Vanilla ice cream or a cheese plate'),
    ('pickers-creek-three-dog-white', 'Fried catfish or a garden salad'),
    ('pickers-creek-rockabilly-red', 'Barbecue or spicy wings'),
    ('pickers-creek-blackberry-blues', 'Dark chocolate or a cheese board'),
    ('grinders-switch-cabernet-sauvignon', 'Grilled steak or sharp cheddar'),
    ('grinders-switch-honeysuckle-rose', 'Fresh fruit or a light salad'),
    ('grinders-switch-switch-red', 'Barbecue or burgers'),
    ('grinders-switch-blondy', 'Baked ham or fruit tart'),
    ('grinders-switch-blackberry-express', 'Vanilla cake or dark chocolate')
) as v(slug, food_pairing)
where public.wines.slug = v.slug;
