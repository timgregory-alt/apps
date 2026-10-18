-- Tennessee Wine Trails — migration 0059: personal tasting notes on the
-- curated wine flight.
--
-- wine_tastings only ever recorded a 1-5 star rating — there was nowhere
-- for a guest to jot down their own impression of a wine, the way
-- custom_wine_tastings already lets them for wines they add themselves.
-- Nullable, same as that table's notes column — no constraint beyond that.

alter table public.wine_tastings add column if not exists notes text;
