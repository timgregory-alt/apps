-- Tennessee Wine Trails — migration 0044: correct Big Creek Winery's hours
-- with the owner-confirmed schedule (replaces the earlier placeholder).

update public.wineries
set hours = 'Closed Mon–Wed · Thu 1pm–6pm · Fri 1pm–8pm · Sat 1pm–9pm · Sun 1pm–6pm'
where slug = 'big-creek';
