-- Tennessee Wine Passport — migration 0023: Yelp review link.

alter table public.wineries add column if not exists yelp_url text;
