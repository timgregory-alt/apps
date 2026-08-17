import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCheckinDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** Age in whole years from an ISO date (YYYY-MM-DD), computed by string parts
 * to avoid UTC/local timezone shifting a birthdate by a day. */
export function calculateAge(birthDateIso: string, today: Date = new Date()): number {
  const [year, month, day] = birthDateIso.split("-").map(Number);
  let age = today.getFullYear() - year;
  const hadBirthdayThisYear =
    today.getMonth() + 1 > month || (today.getMonth() + 1 === month && today.getDate() >= day);
  if (!hadBirthdayThisYear) age--;
  return age;
}

const NEW_WINE_WINDOW_DAYS = 30;

/** True for the first 30 days after a wine's created_at — used for the "New" badge. */
export function isRecentlyAdded(iso: string): boolean {
  const ageMs = Date.now() - new Date(iso).getTime();
  return ageMs >= 0 && ageMs < NEW_WINE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}
