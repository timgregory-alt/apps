-- Tennessee Wine Passport — migration 0001: wine tasting + recommendations
--
-- Run this once in the Supabase SQL editor on an existing project that
-- already has schema.sql / policies.sql / seed.sql applied. It only adds
-- the two new tables below — nothing else is touched, and it's safe to
-- run more than once.

create table if not exists public.wines (
  id uuid primary key default gen_random_uuid(),
  winery_id uuid not null references public.wineries (id) on delete cascade,
  name text not null,
  slug text not null unique,
  varietal text not null,
  style text not null check (style in ('red', 'white', 'rose', 'sweet', 'sparkling')),
  tasting_notes text not null default '',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists wines_winery_idx on public.wines (winery_id);
create index if not exists wines_active_idx on public.wines (active);

create table if not exists public.wine_tastings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  wine_id uuid not null references public.wines (id) on delete cascade,
  liked boolean not null,
  created_at timestamptz not null default now(),
  unique (user_id, wine_id)
);

create index if not exists wine_tastings_user_idx on public.wine_tastings (user_id);
create index if not exists wine_tastings_wine_idx on public.wine_tastings (wine_id);

alter table public.wines enable row level security;
alter table public.wine_tastings enable row level security;

drop policy if exists "Active wines are public" on public.wines;
create policy "Active wines are public" on public.wines
  for select using (active or public.is_admin());

drop policy if exists "Admins manage wines" on public.wines;
create policy "Admins manage wines" on public.wines
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Users view their own wine tastings" on public.wine_tastings;
create policy "Users view their own wine tastings" on public.wine_tastings
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users record their own wine tastings" on public.wine_tastings;
create policy "Users record their own wine tastings" on public.wine_tastings
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users update their own wine tastings" on public.wine_tastings;
create policy "Users update their own wine tastings" on public.wine_tastings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Seed a small tasting flight per winery.
insert into public.wines (winery_id, name, slug, varietal, style, tasting_notes, sort_order)
select w.id, v.name, v.slug, v.varietal, v.style, v.tasting_notes, v.sort_order
from public.wineries w
join (
  values
    ('arrington-vineyards', 'Stony Ridge Cabernet Sauvignon', 'stony-ridge-cabernet-sauvignon', 'Cabernet Sauvignon', 'red', 'Bold and structured, with dark cherry, cedar, and a firm tannic finish. A wine built for a hillside sunset.', 1),
    ('arrington-vineyards', 'Hillside Chardonnay', 'hillside-chardonnay', 'Chardonnay', 'white', 'Lightly oaked with notes of baked pear, vanilla, and a soft, buttery finish.', 2),
    ('woodfeather-farm', 'Farmhouse Rosé', 'farmhouse-rose', 'Rosé', 'rose', 'Crisp and dry, with bright strawberry and watermelon rind. Porch-sipping, any season.', 1),
    ('woodfeather-farm', 'Estate Merlot', 'estate-merlot', 'Merlot', 'red', 'Soft and approachable, with plum, cocoa, and gentle tannins — an easy, everyday red.', 2),
    ('pickers-creek', 'Creekside Riesling', 'creekside-riesling', 'Riesling', 'sweet', 'Off-dry and floral, with ripe peach and a honeyed finish. A warm-afternoon favorite.', 1),
    ('pickers-creek', 'Cotton Trail Red Blend', 'cotton-trail-red-blend', 'Red Blend', 'red', 'Jammy and medium-bodied, blending blackberry and a whisper of black pepper spice.', 2),
    ('grinders-switch', 'Rail Switch Cabernet', 'rail-switch-cabernet', 'Cabernet Sauvignon', 'red', 'Full-bodied and dark, with blackcurrant, tobacco, and a long, smoky finish.', 1),
    ('grinders-switch', 'Depot Muscadine', 'depot-muscadine', 'Muscadine', 'sweet', 'A true Southern classic — lush, sweet, and full of ripe muscadine grape and honeysuckle.', 2)
) as v(winery_slug, name, slug, varietal, style, tasting_notes, sort_order)
  on v.winery_slug = w.slug
on conflict (slug) do update set
  name = excluded.name,
  varietal = excluded.varietal,
  style = excluded.style,
  tasting_notes = excluded.tasting_notes,
  sort_order = excluded.sort_order;
