-- Tennessee Wine Passport — migration 0006: real hours + addresses
--
-- Replaces placeholder "confirm seasonal hours" text with each winery's
-- actual published hours, and fills in real street addresses for
-- Woodfeather Farm and Picker's Creek (previously just "City, TN").
-- Safe to run more than once.

update public.wineries set
  hours = 'Mon–Thu 11am–8pm · Fri 11am–9pm · Sat 11am–8pm · Sun 12pm–8pm (Apr–Oct; shorter hours Nov–Mar)'
where slug = 'arrington-vineyards';

update public.wineries set
  address = '106 N Horton Pkwy, Chapel Hill, TN 37034',
  hours = 'Closed Mon–Wed · Thu 2pm–8pm · Fri–Sat 1pm–9pm · Sun 1pm–6pm'
where slug = 'woodfeather-farm';

update public.wineries set
  address = '1986 New Columbia Hwy, Lewisburg, TN 37091',
  hours = 'Closed Mon–Thu · Fri 11am–8pm (until 9pm w/ live music) · Sat 11am–9pm · Sun 12pm–6pm'
where slug = 'pickers-creek';

update public.wineries set
  hours = 'Closed Mon · Tue–Fri 3pm–8pm · Sat 11am–7pm · Sun 1pm–7pm'
where slug = 'grinders-switch';
