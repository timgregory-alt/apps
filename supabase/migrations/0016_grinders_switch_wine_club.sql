-- Tennessee Wine Passport — migration 0016: real wine club details for
-- Grinder's Switch Winery, sourced from https://gswinery.com/wine-clubs/
-- (placeholder copy was seeded originally).

update public.wineries
set
  wine_club_url = 'https://gswinery.com/wine-clubs/',
  wine_club_title = 'Grinder''s Switch Wine Club',
  wine_club_description = 'No membership fee — choose 3, 6, or 12 bottles of dry, sweet, or mixed wines each shipment, delivered quarterly or bi-monthly with Club 60.',
  wine_club_benefits = array[
    'No membership fee',
    '15% off wine, 20% off merch anytime',
    'Free shipping on every shipment',
    'Complimentary tastings & member gifts'
  ]
where slug = 'grinders-switch';
