-- Tennessee Wine Passport — migration 0024: seed real Yelp URLs.
--
-- Sourced from each winery's live Yelp business listing — worth a quick
-- spot-check against the real pages since business listings can be merged,
-- renamed, or replaced by Yelp over time.

update public.wineries set yelp_url = 'https://www.yelp.com/biz/arrington-vineyards-arrington'
  where slug = 'arrington-vineyards' and yelp_url is null;

update public.wineries set yelp_url = 'https://www.yelp.com/biz/woodfeather-farm-chapel-hill-2'
  where slug = 'woodfeather-farm' and yelp_url is null;

update public.wineries set yelp_url = 'https://www.yelp.com/biz/pickers-creek-winery-lewisburg'
  where slug = 'pickers-creek' and yelp_url is null;

update public.wineries set yelp_url = 'https://www.yelp.com/biz/grinders-switch-winery-columbia'
  where slug = 'grinders-switch' and yelp_url is null;
