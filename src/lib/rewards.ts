import { isTrailComplete } from "@/lib/trail";
import type { WineryWithStatus, WineWithTasting } from "@/lib/types";

export const POINTS_PER_CHECKIN = 25;
export const POINTS_PER_WINE_RATED = 5;
export const COMPLETION_BONUS = 100;
export const POINTS_PER_REFERRAL = 50;
/** Subscribers earn this much more on every check-in, wine rating, and
 * referral. Doesn't apply to the one-time completion bonus — that's a flat
 * achievement reward, not an activity that scales with a multiplier. */
export const SUBSCRIBER_MULTIPLIER = 2;

export interface RewardsPoints {
  total: number;
  checkins: number;
  winesRated: number;
  completionBonus: number;
  referrals: number;
}

/** Points are always derived from check-ins, wine ratings, trail
 * completion, and qualifying referrals — never stored directly — so
 * there's nothing to keep in sync. `totalCheckins` is every check-in the
 * guest has ever made (not deduped by winery) — a guest can check in at
 * the same winery again after a 24-hour cooldown and earn points again,
 * rewarding repeat visits rather than a one-time stamp. */
export function computeRewardsPoints(
  wineries: WineryWithStatus[],
  wines: WineWithTasting[],
  totalCheckins: number,
  referrals = 0,
  isSubscriber = false
): RewardsPoints {
  const checkins = totalCheckins;
  const winesRated = wines.filter((w) => w.tasting != null).length;
  const completionBonus = isTrailComplete(wineries) ? COMPLETION_BONUS : 0;
  const multiplier = isSubscriber ? SUBSCRIBER_MULTIPLIER : 1;

  return {
    total:
      Math.round(
        (checkins * POINTS_PER_CHECKIN + winesRated * POINTS_PER_WINE_RATED + referrals * POINTS_PER_REFERRAL) *
          multiplier
      ) + completionBonus,
    checkins,
    winesRated,
    completionBonus,
    referrals,
  };
}

const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I/L — easy to read and type

/** A short, human-typeable redemption code — the manual fallback for the QR code. */
export function generateRedemptionCode(length = 8): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

/** True on the guest's actual birthday (month + day match), parsed from string
 * parts to avoid UTC/local timezone shifting the date. */
export function isBirthdayToday(birthDate: string | null, today: Date = new Date()): boolean {
  if (!birthDate) return false;
  const [, month, day] = birthDate.split("-").map(Number);
  return today.getMonth() + 1 === month && today.getDate() === day;
}

/** The current calendar year, as the period_key for a recurring (e.g. birthday) reward tier. */
export function currentRewardPeriodKey(): string {
  return String(new Date().getFullYear());
}
