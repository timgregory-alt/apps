-- Tennessee Wine Trails — migration 0032: support account deletion.
--
-- profiles.referred_by pointed at another profile with no ON DELETE action,
-- so deleting a guest who had referred others would fail with a foreign key
-- violation. Switch it to SET NULL — deleting the referrer just drops the
-- reference on the accounts they referred, rather than blocking deletion.
-- Every other table referencing auth.users already cascades on delete, so
-- deleting the auth user (via the Supabase Admin API) cleans up the rest.

alter table public.profiles drop constraint if exists profiles_referred_by_fkey;

alter table public.profiles
  add constraint profiles_referred_by_fkey
  foreign key (referred_by) references public.profiles (id) on delete set null;
