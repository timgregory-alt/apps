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

const NEW_WINE_WINDOW_DAYS = 30;

/** True for the first 30 days after a wine's created_at — used for the "New" badge. */
export function isRecentlyAdded(iso: string): boolean {
  const ageMs = Date.now() - new Date(iso).getTime();
  return ageMs >= 0 && ageMs < NEW_WINE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}
