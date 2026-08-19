-- Tennessee Wine Trails — migration 0026: rebrand from "Tennessee Wine
-- Passport" to "Tennessee Wine Trails". Updates the trail's stored name/
-- description to match; "passport" is kept as the in-app stamp-collection
-- feature name and isn't touched here.

update public.trails
set
  name = 'Tennessee Wine Trails',
  description = 'The original four stops of the Tennessee Wine Trails: a countryside tour through Middle Tennessee''s boutique wineries.'
where slug = 'founding-trail';
