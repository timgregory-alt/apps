-- Tennessee Wine Passport — migration 0018: birth date can only be changed once.
--
-- Without this, a guest could keep editing their birthdate to re-trigger the
-- birthday reward. birth_date_locked flips to true the first time a guest
-- changes their birth_date via the profile form (the signup trigger itself
-- does not set it, so the first self-service edit is the one free change).

alter table public.profiles add column if not exists birth_date_locked boolean not null default false;
