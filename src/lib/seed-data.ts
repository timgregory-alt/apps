import type { Trail, TrailWinery, Winery, Wine } from "./types";
import { feetToMeters } from "./geo";

/**
 * Local fallback content for the Founding Trail.
 *
 * This is used when Supabase isn't configured (local dev, previews without
 * secrets) so the app is always demoable, and doubles as the source data for
 * `supabase/seed.sql`. Once Supabase is connected, `src/lib/data.ts` reads
 * from the database instead and this file is no longer on the hot path.
 *
 * Coordinates are approximate town-center placeholders — replace with each
 * winery's verified tasting-room GPS pin via the admin dashboard before
 * relying on check-in geofencing in production.
 */

export const FOUNDING_TRAIL: Trail = {
  id: "trail-founding",
  name: "Tennessee Wine Passport — Founding Trail",
  slug: "founding-trail",
  description:
    "The original four stops of the Tennessee Wine Passport: a countryside tour through Middle Tennessee's boutique wineries.",
  image: null,
  active: true,
  created_at: "2026-01-01T00:00:00.000Z",
};

export const SEED_WINERIES: Winery[] = [
  {
    id: "winery-arrington",
    name: "Arrington Vineyards",
    slug: "arrington-vineyards",
    city: "Arrington",
    state: "Tennessee",
    address: "6211 Patton Rd, Arrington, TN 37014",
    latitude: 35.7623,
    longitude: -86.6614,
    description:
      "Rolling hillside vineyards in the heart of Williamson County, known for relaxed picnic-style tastings and live music among the vines.",
    hero_image: "",
    logo_mark: null,
    website_url: "https://arringtonvineyards.com",
    wine_club_url: "https://arringtonvineyards.com/wine-club",
    wine_club_title: "Uncorked Club",
    wine_club_description:
      "A quarterly taste of what's new in the barrel room, delivered to your door.",
    wine_club_benefits: [
      "Exclusive small-batch releases",
      "Member-only events on the hillside",
      "Preferred member pricing",
      "Discounts on bottle purchases",
    ],
    hours: "Mon–Sat 11am–9pm · Sun 12pm–6pm (placeholder — confirm seasonal hours)",
    phone: null,
    instagram_url: "https://instagram.com",
    facebook_url: "https://facebook.com",
    checkin_radius_meters: Math.round(feetToMeters(750)),
    active: true,
    sort_order: 1,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "winery-woodfeather",
    name: "Woodfeather Farm Vineyard & Winery",
    slug: "woodfeather-farm",
    city: "Chapel Hill",
    state: "Tennessee",
    address: "Chapel Hill, TN",
    latitude: 35.6337,
    longitude: -86.6903,
    description:
      "A working family farm turned vineyard, pouring estate wines with a warm, unhurried farmhouse welcome.",
    hero_image: "",
    logo_mark: null,
    website_url: "https://example.com/woodfeather",
    wine_club_url: "https://example.com/woodfeather/wine-club",
    wine_club_title: "Woodfeather Wine Club",
    wine_club_description: "Take a little of Woodfeather home with you, season after season.",
    wine_club_benefits: [
      "Exclusive releases",
      "Member events",
      "Member pricing",
      "Bottle discounts",
    ],
    hours: "Fri–Sun 12pm–6pm (placeholder — confirm seasonal hours)",
    phone: null,
    instagram_url: "https://instagram.com",
    facebook_url: "https://facebook.com",
    checkin_radius_meters: Math.round(feetToMeters(750)),
    active: true,
    sort_order: 2,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "winery-pickers-creek",
    name: "Picker's Creek Winery",
    slug: "pickers-creek",
    city: "Lewisburg",
    state: "Tennessee",
    address: "Lewisburg, TN",
    latitude: 35.4495,
    longitude: -86.7911,
    description:
      "A creekside tasting room pouring approachable Southern wines, named for the old cotton-picking trails that once crossed the property.",
    hero_image: "",
    logo_mark: null,
    website_url: "https://example.com/pickers-creek",
    wine_club_url: "https://example.com/pickers-creek/wine-club",
    wine_club_title: "Creekside Club",
    wine_club_description: "Seasonal pours and member-first access, straight from the creek.",
    wine_club_benefits: [
      "Exclusive releases",
      "Member events",
      "Member pricing",
      "Bottle discounts",
    ],
    hours: "Thu–Sun 12pm–7pm (placeholder — confirm seasonal hours)",
    phone: null,
    instagram_url: "https://instagram.com",
    facebook_url: "https://facebook.com",
    checkin_radius_meters: Math.round(feetToMeters(750)),
    active: true,
    sort_order: 3,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "winery-grinders-switch",
    name: "Grinder's Switch Winery",
    slug: "grinders-switch",
    city: "Columbia",
    state: "Tennessee",
    address: "510 North Garden Street, Suite D, Columbia, TN 38401",
    latitude: 35.6151,
    longitude: -87.0353,
    description:
      "Named for the historic rail switch that once ran through Hickman County, this Maury County tasting lounge — set in a converted 1950s tire shop — pours bold reds in a warm, unpretentious setting.",
    hero_image: "",
    logo_mark: null,
    website_url: "https://example.com/grinders-switch",
    wine_club_url: "https://example.com/grinders-switch/wine-club",
    wine_club_title: "Switch Club",
    wine_club_description: "Members-first access to limited releases and barrel picks.",
    wine_club_benefits: [
      "Exclusive releases",
      "Member events",
      "Member pricing",
      "Bottle discounts",
    ],
    hours: "Fri–Sun 12pm–6pm (placeholder — confirm seasonal hours)",
    phone: null,
    instagram_url: "https://instagram.com",
    facebook_url: "https://facebook.com",
    checkin_radius_meters: Math.round(feetToMeters(750)),
    active: true,
    sort_order: 4,
    created_at: "2026-01-01T00:00:00.000Z",
  },
];

export const SEED_TRAIL_WINERIES: TrailWinery[] = SEED_WINERIES.map((w, i) => ({
  id: `tw-${w.slug}`,
  trail_id: FOUNDING_TRAIL.id,
  winery_id: w.id,
  display_order: i + 1,
}));

/**
 * A small tasting flight per winery — placeholder wine names, varietals, and
 * tasting notes to be replaced with each winery's real list via the admin
 * dashboard. Styles are deliberately spread across red/white/rosé/sweet so
 * the "wines you liked" recommendation logic has a real signal to work with.
 */
export const SEED_WINES: Wine[] = [
  {
    id: "wine-arrington-cab",
    winery_id: "winery-arrington",
    name: "Stony Ridge Cabernet Sauvignon",
    slug: "stony-ridge-cabernet-sauvignon",
    varietal: "Cabernet Sauvignon",
    style: "red",
    tasting_notes:
      "Bold and structured, with dark cherry, cedar, and a firm tannic finish. A wine built for a hillside sunset.",
    active: true,
    sort_order: 1,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "wine-arrington-chard",
    winery_id: "winery-arrington",
    name: "Hillside Chardonnay",
    slug: "hillside-chardonnay",
    varietal: "Chardonnay",
    style: "white",
    tasting_notes:
      "Lightly oaked with notes of baked pear, vanilla, and a soft, buttery finish.",
    active: true,
    sort_order: 2,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "wine-woodfeather-rose",
    winery_id: "winery-woodfeather",
    name: "Farmhouse Rosé",
    slug: "farmhouse-rose",
    varietal: "Rosé",
    style: "rose",
    tasting_notes:
      "Crisp and dry, with bright strawberry and watermelon rind. Porch-sipping, any season.",
    active: true,
    sort_order: 1,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "wine-woodfeather-merlot",
    winery_id: "winery-woodfeather",
    name: "Estate Merlot",
    slug: "estate-merlot",
    varietal: "Merlot",
    style: "red",
    tasting_notes:
      "Soft and approachable, with plum, cocoa, and gentle tannins — an easy, everyday red.",
    active: true,
    sort_order: 2,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "wine-pickers-creek-riesling",
    winery_id: "winery-pickers-creek",
    name: "Creekside Riesling",
    slug: "creekside-riesling",
    varietal: "Riesling",
    style: "sweet",
    tasting_notes:
      "Off-dry and floral, with ripe peach and a honeyed finish. A warm-afternoon favorite.",
    active: true,
    sort_order: 1,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "wine-pickers-creek-blend",
    winery_id: "winery-pickers-creek",
    name: "Cotton Trail Red Blend",
    slug: "cotton-trail-red-blend",
    varietal: "Red Blend",
    style: "red",
    tasting_notes:
      "Jammy and medium-bodied, blending blackberry and a whisper of black pepper spice.",
    active: true,
    sort_order: 2,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "wine-grinders-switch-cab",
    winery_id: "winery-grinders-switch",
    name: "Rail Switch Cabernet",
    slug: "rail-switch-cabernet",
    varietal: "Cabernet Sauvignon",
    style: "red",
    tasting_notes:
      "Full-bodied and dark, with blackcurrant, tobacco, and a long, smoky finish.",
    active: true,
    sort_order: 1,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "wine-grinders-switch-muscadine",
    winery_id: "winery-grinders-switch",
    name: "Depot Muscadine",
    slug: "depot-muscadine",
    varietal: "Muscadine",
    style: "sweet",
    tasting_notes:
      "A true Southern classic — lush, sweet, and full of ripe muscadine grape and honeysuckle.",
    active: true,
    sort_order: 2,
    created_at: "2026-01-01T00:00:00.000Z",
  },
];
