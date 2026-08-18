-- Tennessee Wine Passport — migration 0025: subscriber flag (stand-in for billing).
--
-- No real payment processor is wired up yet, so this is a manual,
-- admin-toggled flag that plays the role of "has an active subscription."
-- Once real billing exists, a webhook can flip this same column instead of
-- an admin — nothing downstream needs to change.

alter table public.profiles add column if not exists is_subscriber boolean not null default false;

-- Admins previously had no way to update anyone else's profile row (only
-- their own) — needed so an admin can toggle another guest's is_subscriber.
create policy "Admins can update any profile" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());
