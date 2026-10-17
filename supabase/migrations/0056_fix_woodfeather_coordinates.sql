-- Tennessee Wine Trails — migration 0056: fix Woodfeather's check-in
-- coordinates.
--
-- The address-geocoded lat/lon stored since the project's early seed data
-- was 801m (0.5mi) off from the tasting room's actual GPS position —
-- confirmed by a real guest standing at the building (35.62684, -86.69302),
-- which is why even the 1500ft stop-gap radius from migration 0055 wasn't
-- enough. Corrects the coordinates and dials the radius back down to the
-- normal 750ft default now that the root cause is fixed.

update public.wineries
set
  latitude = 35.62684,
  longitude = -86.69302,
  checkin_radius_meters = round(750 * 0.3048)::integer
where slug = 'woodfeather-farm';
