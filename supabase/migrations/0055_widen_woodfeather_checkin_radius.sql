-- Tennessee Wine Trails — migration 0055: widen Woodfeather's check-in
-- radius as a stop-gap.
--
-- A real guest (not a test/admin account) was blocked from checking in
-- while physically in the tasting room. The geolocation code itself is
-- already solid (fresh, high-accuracy GPS, no stale cache), so this is
-- either GPS drift near the building or the stored coordinates being a
-- bit off from the actual tasting room door. Widening from 750ft to
-- 1500ft buys headroom for real guests in the meantime; once we have
-- the tasting room's actual GPS coordinates we can correct
-- latitude/longitude directly and dial the radius back down.

update public.wineries
set checkin_radius_meters = round(1500 * 0.3048)::integer
where slug = 'woodfeather-farm';
