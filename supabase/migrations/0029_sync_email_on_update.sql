-- Tennessee Wine Trails — migration 0029: keep profiles.email in sync.
--
-- Email changes go through Supabase Auth's confirmation flow
-- (supabase.auth.updateUser({ email })), which only updates auth.users.email
-- once the guest clicks the confirmation link. This trigger mirrors that
-- confirmed change into public.profiles so the rest of the app (which reads
-- profiles.email, not auth.users directly) stays accurate.

create or replace function public.handle_user_email_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update on auth.users
  for each row execute procedure public.handle_user_email_update();
