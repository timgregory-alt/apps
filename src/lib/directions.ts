/** Builds platform map links so "Get Directions" can hand off to the device's native app. */

export function appleMapsUrl(lat: number, lon: number, label: string): string {
  const q = encodeURIComponent(label);
  return `https://maps.apple.com/?daddr=${lat},${lon}&q=${q}`;
}

export function googleMapsUrl(lat: number, lon: number, label: string): string {
  const q = encodeURIComponent(label);
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&destination_place_id=&q=${q}`;
}

export function isAppleDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);
}

/** Opens the best-fit native maps app for directions to a winery. */
export function openDirections(lat: number, lon: number, label: string) {
  const url = isAppleDevice() ? appleMapsUrl(lat, lon, label) : googleMapsUrl(lat, lon, label);
  window.open(url, "_blank", "noopener,noreferrer");
}
