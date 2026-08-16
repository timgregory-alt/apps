"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { evaluateDistance, formatDistance } from "@/lib/geo";
import { useGeolocation } from "@/hooks/useGeolocation";
import { WineryPopupCard } from "@/components/map/WineryPopupCard";
import type { WineryWithStatus } from "@/lib/types";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const MAPBOX_STYLE =
  process.env.NEXT_PUBLIC_MAPBOX_STYLE || "mapbox://styles/mapbox/streets-v12";

function createMarkerElement(visited: boolean): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "twp-marker";
  el.setAttribute("role", "button");
  el.setAttribute("tabindex", "0");
  el.style.width = "34px";
  el.style.height = "44px";
  el.style.cursor = "pointer";
  el.innerHTML = `
    <svg width="34" height="44" viewBox="0 0 34 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 0C7.6 0 0 7.6 0 17c0 12 17 27 17 27s17-15 17-27C34 7.6 26.4 0 17 0Z"
        fill="${visited ? "#b0904f" : "#5e1a2e"}" stroke="#faf6ee" stroke-width="1.5"/>
      ${
        visited
          ? '<path d="M11 17.5l4 4 8-8.5" stroke="#faf6ee" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'
          : '<circle cx="17" cy="17" r="5" fill="#faf6ee"/>'
      }
    </svg>`;
  return el;
}

export function TrailMap({ wineries }: { wineries: WineryWithStatus[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [selected, setSelected] = useState<WineryWithStatus | null>(null);
  const { coords, locate } = useGeolocation();

  useEffect(() => {
    locate().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fitToWineries = useCallback((map: mapboxgl.Map) => {
    const bounds = new mapboxgl.LngLatBounds();
    wineries.forEach((w) => bounds.extend([w.longitude, w.latitude]));
    map.fitBounds(bounds, { padding: 64, maxZoom: 10.5, duration: 0 });
  }, [wineries]);

  useEffect(() => {
    if (!MAPBOX_TOKEN || !containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAPBOX_STYLE,
      center: [-86.9, 35.65],
      zoom: 8.5,
      attributionControl: false,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new mapboxgl.AttributionControl({ compact: true }));

    map.on("load", () => fitToWineries(map));
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !MAPBOX_TOKEN) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = wineries.map((w) => {
      const el = createMarkerElement(w.status !== "not_visited");
      const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([w.longitude, w.latitude])
        .addTo(map);
      const select = () => setSelected(w);
      el.addEventListener("click", select);
      el.addEventListener("keydown", (e) => {
        if ((e as KeyboardEvent).key === "Enter") select();
      });
      return marker;
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
    };
  }, [wineries]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex h-[70vh] w-full flex-col items-center justify-center gap-2 bg-[var(--color-parchment)] px-8 text-center">
        <p className="font-serif-display text-lg text-[var(--color-charcoal)]">
          Map unavailable
        </p>
        <p className="max-w-xs text-sm text-[var(--color-charcoal)]/60">
          Add a <code className="rounded bg-black/5 px-1">NEXT_PUBLIC_MAPBOX_TOKEN</code> to your
          environment to enable the interactive trail map.
        </p>
      </div>
    );
  }

  const distanceMiles = selected && coords
    ? evaluateDistance(coords.latitude, coords.longitude, selected.latitude, selected.longitude, 0).miles
    : null;

  return (
    <div className="relative h-[70vh] w-full overflow-hidden">
      <div ref={containerRef} className="h-full w-full" />

      {selected && (
        <WineryPopupCard
          winery={selected}
          distanceLabel={distanceMiles != null ? formatDistance(distanceMiles) : undefined}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
