"use client";

import { useCallback, useState } from "react";

export interface GeoCoords {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export type GeoStatus = "idle" | "locating" | "success" | "error";

interface UseGeolocationResult {
  status: GeoStatus;
  coords: GeoCoords | null;
  error: string | null;
  locate: () => Promise<GeoCoords>;
}

/** Wraps the browser Geolocation API in a small, promise-friendly hook. */
export function useGeolocation(): UseGeolocationResult {
  const [status, setStatus] = useState<GeoStatus>("idle");
  const [coords, setCoords] = useState<GeoCoords | null>(null);
  const [error, setError] = useState<string | null>(null);

  const locate = useCallback((): Promise<GeoCoords> => {
    setStatus("locating");
    setError(null);

    return new Promise((resolve, reject) => {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        const message = "Location services aren't available on this device.";
        setStatus("error");
        setError(message);
        reject(new Error(message));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const next: GeoCoords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          setCoords(next);
          setStatus("success");
          resolve(next);
        },
        (err) => {
          const message =
            err.code === err.PERMISSION_DENIED
              ? "Location access was denied. Enable location services to check in."
              : "We couldn't determine your location. Please try again.";
          setStatus("error");
          setError(message);
          reject(new Error(message));
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });
  }, []);

  return { status, coords, error, locate };
}
