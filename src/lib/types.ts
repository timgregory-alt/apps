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
  /** Optional page to check for upcoming events. Falls back to website_url when unset. */
  events_page_url: string | null;
  /** Optional link to this winery's Yelp page, for the "Review on Yelp" button. */
  yelp_url: string | null;
}

export interface WineSyncLogEntry {
  id: UUID;
  winery_id: UUID;
  ran_at: string;
  wines_added: number;
  status: "ok" | "error";
  detail: string | null;
}

/** A single upcoming event at a winery, kept current by the weekly sync job
 * (or added manually by that winery's staff via the portal). */
export interface WineryEvent {
  id: UUID;
  winery_id: UUID;
  title: string;
  description: string | null;
  /** ISO date (YYYY-MM-DD). */
  event_date: string;
  /** Free text — e.g. "6:00 PM - 9:00 PM" — since sources rarely give structured times. */
  event_time: string | null;
  source_url: string | null;
  created_at: string;
  /** Marks this as a premium event shown on the VIP page — subscribers get
   * early access, same as the early-access window on regular events. */
  vip_only: boolean;
  /** Optional link to buy tickets / RSVP. */
  ticket_url: string | null;
}

/** An event still within its early-access window for a non-subscriber
 * viewer — the date shows, but the details stay locked behind Premium. */
export interface LockableWineryEvent extends WineryEvent {
  locked: boolean;
}

/** One winery's upcoming events (may be empty) — the shape the Explore
 * page's by-winery events carousel consumes, one slide per winery. */
export interface WineryEventGroup {
  winery_id: UUID;
  winery_name: string;
  winery_slug: string;
  events: LockableWineryEvent[];
}

export interface EventSyncLogEntry {
  id: UUID;
  winery_id: UUID;
  ran_at: string;
  events_added: number;
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
  | "trail_completion"
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

export interface TrailCompletion {
  id: UUID;
  user_id: UUID;
  trail_id: UUID;
  completed_at: string;
}

/** A guest's 1-5 star rating of the app itself (not a wine), with optional feedback. */
export interface AppRating {
  id: UUID;
  user_id: UUID;
  rating: number;
  feedback: string | null;
  created_at: string;
  updated_at: string;
}

export type BugReportStatus = "open" | "resolved";

/** A guest-submitted "something's broken" report from the Profile page. */
export interface BugReport {
  id: UUID;
  user_id: UUID;
  description: string;
  page_url: string | null;
  status: BugReportStatus;
  created_at: string;
}

export interface Profile {
  id: UUID;
  name: string | null;
  email: string | null;
  profile_image: string | null;
  /** ISO date (YYYY-MM-DD) — collected at signup for 21+ age verification and birthday rewards. */
  birth_date: string | null;
  /** True once the guest has used their one allowed birth_date change — prevents
   * repeatedly editing it to re-trigger the birthday reward. */
  birth_date_locked: boolean;
  /** The id of the guest who referred this account, if any — set once at signup. */
  referred_by: UUID | null;
  /** Collected at signup, optional — where the guest is traveling from. */
  zip_code: string | null;
  /** When the guest agreed to the Terms and Conditions at signup — null for
   * accounts created before this requirement existed. */
  agreed_to_terms_at: string | null;
  /** Manually toggled by an admin for now — stands in for a real subscription
   * until billing exists. Gates things like early access to new events. */
  is_subscriber: boolean;
  trail_start_date: string | null;
  created_at: string;
  /** Set only on winery-staff accounts (created by an admin invite, never by
   * self-signup) — marks this profile as belonging to that winery's portal
   * rather than being a guest. Null for every regular guest account. */
  winery_id: UUID | null;
}

/** Winery merged with the current user's visit state — the shape most UI consumes. */
export interface WineryWithStatus extends Winery {
  status: CheckinStatus;
  checkin: Checkin | null;
}

export type WineStyle = "red" | "white" | "rose" | "sweet" | "sparkling" | "mead";

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

export interface RewardTier {
  id: UUID;
  label: string;
  points_required: number;
  /** Tennessee law prohibits discounting bottle purchases — this applies to
   * food, merch, and tastings only, never a bottle. */
  discount_percent: number;
  /** Optional richer discount for subscribers at this same tier — null
   * means subscribers get the same discount_percent as everyone else. */
  subscriber_discount_percent: number | null;
  /** When set, the guest picks one of these instead of getting a flat discount_percent reward. */
  choice_options: string[] | null;
  /** A surprise reward that isn't part of the regular points ladder — only
   * appears (and is redeemable) on the guest's actual birthday, every year. */
  birthday_only: boolean;
  sort_order: number;
  active: boolean;
  created_at: string;
}

export type RewardRedemptionStatus = "issued" | "redeemed";

export interface RewardRedemption {
  id: UUID;
  user_id: UUID;
  tier_id: UUID;
  code: string;
  /** Empty for one-time tiers; the calendar year for recurring tiers (birthday_only)
   * so a new redemption can be issued each year instead of only once ever. */
  period_key: string;
  /** The option the guest picked, for tiers with choice_options. */
  chosen_option: string | null;
  /** Points deducted from the guest's spendable balance for this redemption
   * (captured at redemption time — 0 for the free, date-gated birthday tier). */
  points_spent: number;
  status: RewardRedemptionStatus;
  issued_at: string;
  redeemed_at: string | null;
}
