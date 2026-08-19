-- Tennessee Wine Trails — migration 0026: rebrand from "Tennessee Wine
-- Passport" to "Tennessee Wine Trails". Updates the trail's stored name/
-- description to match; "passport" is kept as the in-app stamp-collection
-- feature name and isn't touched here.

update public.trails
set
  name = 'Tennessee Wine Trails',
  description = 'The original Middle Tennessee wine trail: a countryside tour through four boutique wineries.'
where slug = 'founding-trail';
