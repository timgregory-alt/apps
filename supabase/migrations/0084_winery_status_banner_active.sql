-- Tennessee Wine Trails — migration 0084: status banner on/off toggle.
--
-- status_banner (migration 0083) showed whenever text was saved, and hid
-- only when that text was deleted — easy to forget to clear, and loses the
-- message for next time. Add a separate active flag so staff can keep the
-- message saved and just check/uncheck a box to show or hide it.

alter table public.wineries
  add column if not exists status_banner_active boolean not null default false;

-- Anyone who already saved banner text under 0083 clearly wanted it shown.
update public.wineries
  set status_banner_active = true
  where status_banner is not null and status_banner <> '';
