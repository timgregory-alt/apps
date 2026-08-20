-- Tennessee Wine Trails — migration 0030: allow multiple app ratings per user.
--
-- A guest may come back later with new feedback after noticing something or
-- having more to say — each submission is now its own row instead of
-- overwriting the previous one (the original schema had `unique (user_id)`
-- and the submit action used to upsert on that).

alter table public.app_ratings drop constraint if exists app_ratings_user_id_key;
