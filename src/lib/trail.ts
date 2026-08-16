import { evaluateDistance, estimateDrivingMinutes, metersToMiles } from "./geo";
import type { WineryWithStatus } from "./types";

export interface RecommendedStop {
  winery: WineryWithStatus;
  distanceMiles: number;
  etaMinutes: number;
}

/**
 * Recommends the next unvisited winery, prioritizing proximity when the
 * user's location is known. Falls back to trail order otherwise. Once every
 * winery on the trail is complete, returns null — callers should show the
 * completion experience instead of a recommendation.
 */
export function recommendNextStop(
  wineries: WineryWithStatus[],
  fromLat?: number,
  fromLon?: number
): RecommendedStop | null {
  const unvisited = wineries.filter((w) => w.status === "not_visited");
  if (unvisited.length === 0) return null;

  if (fromLat == null || fromLon == null) {
    const winery = unvisited[0];
    return { winery, distanceMiles: 0, etaMinutes: 0 };
  }

  const ranked = unvisited
    .map((winery) => {
      const { miles } = evaluateDistance(
        fromLat,
        fromLon,
        winery.latitude,
        winery.longitude,
        0
      );
      return { winery, distanceMiles: miles, etaMinutes: estimateDrivingMinutes(miles) };
    })
    .sort((a, b) => a.distanceMiles - b.distanceMiles);

  return ranked[0];
}

export function isTrailComplete(wineries: WineryWithStatus[]): boolean {
  return wineries.length > 0 && wineries.every((w) => w.status !== "not_visited");
}

export function visitedCount(wineries: WineryWithStatus[]): number {
  return wineries.filter((w) => w.status !== "not_visited").length;
}

export interface LegEstimate {
  fromId: string;
  toId: string;
  miles: number;
  minutes: number;
}

/** Straight-line driving-time estimates between consecutive trail stops, for planning UI. */
export function estimateTrailLegs(wineries: WineryWithStatus[]): LegEstimate[] {
  const legs: LegEstimate[] = [];
  for (let i = 0; i < wineries.length - 1; i++) {
    const a = wineries[i];
    const b = wineries[i + 1];
    const miles = metersToMiles(
      evaluateDistance(a.latitude, a.longitude, b.latitude, b.longitude, 0).meters
    );
    legs.push({ fromId: a.id, toId: b.id, miles, minutes: estimateDrivingMinutes(miles) });
  }
  return legs;
}
