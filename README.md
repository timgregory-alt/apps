# Tennessee Wine Passport

A premium, mobile-first digital passport for touring Tennessee's boutique wineries — check in with GPS, collect an animated stamp, share a story graphic, and unlock a completion badge after visiting every stop on the trail.

Built with Next.js (App Router) + TypeScript + Tailwind CSS, Supabase (auth, database, RLS), and Mapbox.

The Founding Trail ships with four wineries:

- Arrington Vineyards — Arrington, TN
- Woodfeather Farm Vineyard & Winery — Chapel Hill, TN
- Picker's Creek Winery — Lewisburg, TN
- Grinder's Switch Winery — Columbia, TN

The app runs without any environment variables configured — it falls back to local seed data so you can explore the UI immediately. Check-ins won't persist and auth is disabled until Supabase is connected.

## 1. Install

```bash
npm install
npm run dev
```

Open http://localhost:3000. On a phone, use your machine's LAN IP (or a tunnel like `ngrok`) so GPS check-in has a real location to test against — desktop browsers can't check in near an actual winery, but you can override coordinates via your browser's device-location dev tools.

## 2. Environment variables

Copy `.env.example` to `.env.local` and fill in the values below.

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | For auth/persistence | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | For auth/persistence | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Server-only key for privileged admin operations. Keep secret. |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | For the map | A Mapbox public token (`pk.…`) |
| `NEXT_PUBLIC_MAPBOX_STYLE` | Optional | A custom Mapbox Studio style URL for on-brand map tiles |

Without Supabase configured, the app is still fully browsable (home, passport, map, winery pages) using local seed data, and GPS check-in will run the real distance check but tell you the stamp can't be saved. Without Mapbox, `/map` shows a friendly placeholder instead of failing.

## 3. Configure Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run the three files in `supabase/` **in order**:
   1. `schema.sql` — tables, indexes, and the auto-provisioning trigger that creates a `profiles` row on signup.
   2. `policies.sql` — Row Level Security policies (everyone can read active wineries/trails; users can only read/write their own check-ins, shares, wine club clicks, and completions; admins get broader access via an `is_admin` flag on `profiles`).
   3. `seed.sql` — inserts the Founding Trail and its four wineries (safe to re-run).
3. Grab your Project URL and anon key from **Project Settings → API** and add them to `.env.local`.
4. To access `/admin`, promote your account after signing up once in the app:
   ```sql
   update public.profiles set is_admin = true where email = 'you@example.com';
   ```
5. **Auth settings**: In Supabase Auth settings, add your dev and production URLs (e.g. `http://localhost:3000`, `https://yourapp.vercel.app`) to the Redirect URLs allow-list — this is required for magic links, signup confirmation, and password reset to redirect back into the app's `/auth/callback` route.
6. Email/password and magic-link sign-in are enabled by default. The auth layer (`src/lib/supabase/*`) is written against Supabase's provider-agnostic session model, so adding Apple or Google sign-in later is a matter of enabling the provider in the Supabase dashboard and adding a button that calls `supabase.auth.signInWithOAuth({ provider: 'apple' | 'google' })` — no changes to the data layer or protected routes are needed.

### Schema overview

`users` are handled by Supabase Auth directly; `profiles` extends that with app-specific fields (name, avatar, admin flag, passport start date). Everything else mirrors the brief: `wineries`, `trails`, `trail_wineries` (ordered join table), `checkins` (one per user per winery, GPS-verified server-side), `share_events`, `wine_club_clicks`, `passport_completions`, plus two additions that make the rest of the spec possible without a schema change later:

- `rewards` — reward types (merchandise, discount, tasting, bottle, giveaway) attachable to a trail's completion. None are `active` yet, per the brief — this just makes turning one on later a data change, not a code change.
- `winery_page_views` — lightweight, anonymous-friendly page-view analytics.

`wineries` and `trails` also carry `sponsored`, `featured`, and (on wineries) `subscription_status` columns so participating-winery subscriptions, sponsored placements, and featured trails can be turned on later without another migration.

## 4. Configure Mapbox

1. Create a free account at [mapbox.com](https://mapbox.com) and generate a public token under **Account → Access tokens**.
2. Add it as `NEXT_PUBLIC_MAPBOX_TOKEN`.
3. Optional: design a custom light, warm-toned style in [Mapbox Studio](https://studio.mapbox.com) to match the app's ivory/burgundy palette, and set its style URL as `NEXT_PUBLIC_MAPBOX_STYLE`. The map defaults to `mapbox://styles/mapbox/light-v11` otherwise.

## 5. Deploy on Vercel

1. Push this repo to GitHub and import it in [Vercel](https://vercel.com/new).
2. Add the environment variables from step 2 in the Vercel project's **Settings → Environment Variables**.
3. Add your production domain to Supabase Auth's Redirect URLs allow-list (see step 3.5 above).
4. Deploy. The app is a standard Next.js App Router project — no special build configuration is required.

## 6. Add another winery

No code changes are needed:

- **Via the admin dashboard** (recommended): sign in with an admin account, go to `/admin/wineries → Add Winery`, fill in the details (name, address, coordinates, description, wine club info, check-in radius) and save. It appears on the trail immediately.
- **Via SQL**: insert a row into `wineries`, then a row into `trail_wineries` linking it to the desired trail with a `display_order`. See `supabase/seed.sql` for the pattern.

Every winery page, map pin, passport stamp, and share graphic is built from this shared `Winery` shape (`src/lib/types.ts`) and reusable components (`src/components/winery/*`), so a new row is all it takes.

Photography: set `hero_image` to a hosted image URL. Until then, each winery renders an elegant generated placeholder (`src/components/winery/WineryImage.tsx`) so the app never shows a broken image.

## 7. Add another wine trail

The Founding Trail is not hard-coded — `trails` and `trail_wineries` exist specifically so a location can belong to more than one trail, and a trail can be added without touching the app:

1. Insert a new row into `trails` (e.g. `name: 'Nashville Wine Trail'`, a unique `slug`, `active: true`).
2. Link existing or new wineries to it via `trail_wineries` with a `display_order`.
3. The `/explore` screen already lists placeholder cards for trails on the roadmap (Nashville, South Central, Upper Cumberland, East Tennessee, Weekend) — wire it up to read all `active` trails once more than one exists, and give users a way to switch which trail their passport/map/home screen reflect.

The data layer (`src/lib/data.ts`) currently reads the Founding Trail by slug; generalizing it to accept a trail slug/id parameter is the only change needed to support a user picking between multiple active trails and collecting multiple passports.

## Project structure

```
src/
  app/                 Routes (App Router): home, passport, map, explore, profile,
                        winery/[slug], trail/plan, completion, auth pages, admin/*, api/*
  components/
    ui/                Button, Card, Sheet, ProgressBar, QrCode, brand icons
    layout/            BottomNav, Header
    passport/          PassportStamp, PassportEntry
    winery/             WineryHero, WineryImage (placeholder art), info rows, directions
    map/               TrailMap (Mapbox), MiniTrailMap, popup card, trail planner
    checkin/           GPS check-in flow, celebration overlay, next-stop sheet
    share/             ShareGraphic (IG Story template), ShareSheet
    wineclub/          Wine club section, modal, tracked link
    completion/        Completion badge, banner, share button
    admin/             Admin winery form
  lib/
    supabase/          Browser/server/middleware Supabase clients
    types.ts            Domain types mirroring the schema
    data.ts, admin.ts   Server-only data access (Supabase, with seed-data fallback)
    trail.ts             Next-stop recommendation, trail-complete logic
    geo.ts, directions.ts  Haversine distance, geofencing, native maps links
    seed-data.ts         Local fallback content for the Founding Trail
supabase/
  schema.sql, policies.sql, seed.sql
```

## Installing it as a mobile app

The app ships a web manifest (`src/app/manifest.ts`) and generated app icons (`src/app/app-icon/[size]/route.tsx`, `src/app/apple-icon.tsx`), so once it's deployed, visitors can add it to their home screen and it opens full-screen like a native app — no App Store build required:

- **iPhone (Safari):** Share → Add to Home Screen
- **Android (Chrome):** ⋮ menu → Add to Home Screen / Install App (Chrome may also prompt automatically)

## Design system

Warm ivory backgrounds, deep burgundy and charcoal, muted gold accents, a serif display face (Fraunces) for headlines over a clean sans (Inter) for body text — defined as CSS custom properties in `src/app/globals.css` and consumed via Tailwind v4's `@theme inline`. Motion is deliberately restrained: soft fades, a spring-based stamp animation, and a brief gold sparkle on check-in — no cartoon bounce.

## What's intentionally not wired up yet

- **Paid subscriptions / sponsorship billing** — the schema (`sponsored`, `featured`, `subscription_status`) is ready; no billing provider is integrated.
- **Completion rewards** — the `rewards` table supports attaching a reward to a trail completion, but nothing is marked `active` yet, per the brief.
- **Per-winery partner dashboards** — the admin dashboard aggregates analytics per winery today; scoping a winery owner's login to only their own winery is a natural next step on top of the existing `is_admin` pattern.
- **Apple/Google sign-in** — see step 3.6 above.
