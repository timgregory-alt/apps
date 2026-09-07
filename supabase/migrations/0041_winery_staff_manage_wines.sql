-- Tennessee Wine Trails — migration 0041: let winery staff manage their own
-- wine list manually (add/edit/delete), now that the paid Claude-powered
-- sync trigger has been pulled from the portal to avoid handing out a
-- cost-incurring action to every winery. Additive alongside the existing
-- "Admins manage wines" policy, same pattern as wineries/winery_hours/
-- winery_events in migration 0038.

drop policy if exists "Winery staff manage their own wines" on public.wines;
create policy "Winery staff manage their own wines" on public.wines
  for all using (public.is_winery_staff_for(winery_id)) with check (public.is_winery_staff_for(winery_id));
