-- Tennessee Wine Trails — migration 0033: dog sitter info page.
--
-- Adds a `dogs` table for four fixed profile cards (photo, food, medication,
-- vet/emergency info) shown at the no-login /dog-sitter page and edited by
-- an admin at /admin/dogs. Publicly readable by design — that's the link
-- shared with the sitter — writes are admin-only via RLS.

create table if not exists public.dogs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  photo text,
  breed text,
  age text,
  weight text,
  food text,
  medication text,
  allergies text,
  vet_name text,
  vet_phone text,
  emergency_contact_name text,
  emergency_contact_phone text,
  notes text,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists dogs_sort_idx on public.dogs (sort_order);

alter table public.dogs enable row level security;

drop policy if exists "Dogs are public" on public.dogs;
create policy "Dogs are public" on public.dogs
  for select using (true);

drop policy if exists "Admins manage dogs" on public.dogs;
create policy "Admins manage dogs" on public.dogs
  for all using (public.is_admin()) with check (public.is_admin());

insert into public.dogs (slug, name, sort_order)
values
  ('dog-1', 'Dog 1', 1),
  ('dog-2', 'Dog 2', 2),
  ('dog-3', 'Dog 3', 3),
  ('dog-4', 'Dog 4', 4)
on conflict (slug) do nothing;
