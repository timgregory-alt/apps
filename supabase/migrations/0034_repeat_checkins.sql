-- Tennessee Wine Trails — migration 0034: allow repeat check-ins per winery.
--
-- Check-ins were capped to one per winery ever (unique user_id+winery_id).
-- Switched to one per winery per 24 hours instead, enforced in the API
-- route rather than the database, so a returning guest can check in again
-- on a later trip and earn points again — rewarding repeat visits instead
-- of a single one-and-done stamp.

alter table public.checkins drop constraint if exists checkins_user_id_winery_id_key;

create index if not exists checkins_user_winery_date_idx
  on public.checkins (user_id, winery_id, checkin_date desc);
