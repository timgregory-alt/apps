/**
 * Core domain types mirroring the Supabase schema (see supabase/schema.sql).
 * Keeping these hand-written (rather than only relying on generated types)
 * lets the UI layer stay stable while the schema evolves.
 */

export type UUID = string;

export interface Trail {
  id: UUID;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  active: boolean;
  created_at: string;
}

export interface Winery {
  id: UUID;
  name: string;
  slug: string;
  city: string;
  state: string;
  address: string;
  latitude: number;
  longitude: number;
  description: string;
  hero_image: string;
  logo_mark: string | null;
  website_url: string | null;
  wine_club_url: string | null;
  wine_club_title: string | null;
  wine_club_description: string | null;
  wine_club_benefits: string[] | null;
  hours: string | null;
  phone: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  checkin_radius_meters: number;
  active: boolean;
  sort_order: number;
  created_at: string;
  /** Optional page to check for new wines. Falls back to website_url when unset. */
  wine_menu_url: string | null;
}

export interface WineSyncLogEntry {
  id: UUID;
  winery_id: UUID;
  ran_at: string;
  wines_added: number;
  status: "ok" | "error";
  detail: string | null;
}

/** One seasonal block of a winery's hours (e.g. "Apr–Oct"). A winery with no
 * rows here just displays its plain `hours` text field as-is. */
export interface WineryHours {
  id: UUID;
  winery_id: UUID;
  label: string;
  start_month: number;
  end_month: number;
  hours_text: string;
  sort_order: number;
  created_at: string;
}

export interface TrailWinery {
  id: UUID;
  trail_id: UUID;
  winery_id: UUID;
  display_order: number;
}

export type CheckinStatus = "not_visited" | "visited" | "completed";

export interface Checkin {
  id: UUID;
  user_id: UUID;
  winery_id: UUID;
  latitude: number;
  longitude: number;
  distance_meters: number | null;
  checkin_date: string;
  verified: boolean;
  created_at: string;
}

export type ShareType =
  | "winery_checkin"
  | "passport_completion"
  | "native_share"
  | "copy_link"
  | "facebook"
  | "instagram"
  | "save_image";

export interface ShareEvent {
  id: UUID;
  user_id: UUID;
  winery_id: UUID | null;
  share_type: ShareType;
  created_at: string;
}

export interface WineClubClick {
  id: UUID;
  user_id: UUID;
  winery_id: UUID;
  created_at: string;
}

export interface PassportCompletion {
  id: UUID;
  user_id: UUID;
  trail_id: UUID;
  completed_at: string;
}

export interface Profile {
  id: UUID;
  name: string | null;
  email: string | null;
  profile_image: string | null;
  passport_start_date: string | null;
  created_at: string;
}

/** Winery merged with the current user's visit state — the shape most UI consumes. */
export interface WineryWithStatus extends Winery {
  status: CheckinStatus;
  checkin: Checkin | null;
}

export type WineStyle = "red" | "white" | "rose" | "sweet" | "sparkling";

export interface Wine {
  id: UUID;
  winery_id: UUID;
  name: string;
  slug: string;
  varietal: string;
  style: WineStyle;
  tasting_notes: string;
  food_pairing: string | null;
  sold_out: boolean;
  active: boolean;
  sort_order: number;
  created_at: string;
}

export interface WineTasting {
  id: UUID;
  user_id: UUID;
  wine_id: UUID;
  /** 1-5 stars. */
  rating: number;
  created_at: string;
}

/** A wine a user tried that isn't in the winery's curated flight — logged by them, visible only to them. */
export interface CustomWineTasting {
  id: UUID;
  user_id: UUID;
  winery_id: UUID;
  name: string;
  style: WineStyle;
  notes: string | null;
  food_pairing: string | null;
  liked: boolean;
  created_at: string;
}

/** A wine merged with the current user's rating, plus its winery for display. */
export interface WineWithTasting extends Wine {
  winery: Winery;
  tasting: WineTasting | null;
}

export interface WineRecommendation {
  wine: Wine;
  winery: Winery;
  reason: string;
}

export interface WineryRecommendation {
  winery: WineryWithStatus;
  matchingWines: Wine[];
  reason: string;
}

export interface DistanceResult {
  meters: number;
  miles: number;
  withinRadius: boolean;
}
