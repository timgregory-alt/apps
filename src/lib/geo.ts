import type { DistanceResult } from "./types";

const EARTH_RADIUS_METERS = 6371000;
const METERS_PER_MILE = 1609.344;

/** Great-circle distance between two coordinates, in meters. */
export function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

export function metersToMiles(meters: number): number {
  return meters / METERS_PER_MILE;
}

export function milesToMeters(miles: number): number {
  return miles * METERS_PER_MILE;
}

export function feetToMeters(feet: number): number {
  return feet * 0.3048;
}

export function metersToFeet(meters: number): number {
  return Math.round(meters / 0.3048);
}

/** Evaluates a user's coordinates against a winery's check-in geofence. */
export function evaluateDistance(
  userLat: number,
  userLon: number,
  targetLat: number,
  targetLon: number,
  radiusMeters: number
): DistanceResult {
  const meters = haversineMeters(userLat, userLon, targetLat, targetLon);
  return {
    meters,
    miles: metersToMiles(meters),
    withinRadius: meters <= radiusMeters,
  };
}

export function formatDistance(miles: number): string {
  if (miles < 0.1) return "You're here";
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}

/** Rough driving-time estimate for planning UI when a routing API isn't available. */
export function estimateDrivingMinutes(miles: number): number {
  const avgSpeedMph = 38;
  return Math.max(3, Math.round((miles / avgSpeedMph) * 60));
}
