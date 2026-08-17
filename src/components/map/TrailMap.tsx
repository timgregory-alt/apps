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
  process.env.NEXT_PUBLIC_MAPBOX_STYLE || "mapbox://styles/mapbox/light-v11";

/** A pin with a tiny wine glass inside — empty outline when not visited,
 * poured full once it is, echoing the same fill motif used everywhere else
 * in the app (the tasting glass, the stamp). */
function createMarkerElement(wineryId: string, visited: boolean): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "twp-marker";
  el.setAttribute("role", "button");
  el.setAttribute("tabindex", "0");
  el.style.width = "34px";
  el.style.height = "44px";
  el.style.cursor = "pointer";
  const clipId = `twp-glass-${wineryId}`;
  el.innerHTML = `
    <svg width="34" height="44" viewBox="0 0 34 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 0C7.6 0 0 7.6 0 17c0 12 17 27 17 27s17-15 17-27C34 7.6 26.4 0 17 0Z"
        fill="${visited ? "#b0904f" : "#5e1a2e"}" stroke="#faf6ee" stroke-width="1.5"/>
      ${
        visited
          ? `<defs><clipPath id="${clipId}"><path d="M13,10 C13,16 15,21 17,24 C19,21 21,16 21,10 Z"/></clipPath></defs>
             <g clip-path="url(#${clipId})"><rect x="12" y="8" width="10" height="18" fill="#5e1a2e"/></g>`
          : ""
      }
      <g fill="none" stroke="#faf6ee" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M13,10 Q17,12.5 21,10"/>
        <path d="M13,10 C13,16 15,21 17,24"/>
        <path d="M21,10 C21,16 19,21 17,24"/>
        <path d="M17,24 L17,30"/>
        <path d="M14,31.5 L20,31.5"/>
      </g>
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

  /** Connects the stops in their intended trail order — the same order
   * they're already listed in throughout the app — as a dashed gold line. */
  const drawRoute = useCallback(
    (map: mapboxgl.Map) => {
      const geojson = {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: wineries.map((w): [number, number] => [w.longitude, w.latitude]),
        },
      } as const;
      const existing = map.getSource("trail-route") as mapboxgl.GeoJSONSource | undefined;
      if (existing) {
        existing.setData(geojson);
        return;
      }
      map.addSource("trail-route", { type: "geojson", data: geojson });
      // A pale casing under the dashed gold line keeps the route legible
      // over any basemap, and reads as a deliberate trail rather than a
      // stray GPS trace.
      map.addLayer({
        id: "trail-route-casing",
        type: "line",
        source: "trail-route",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#faf6ee",
          "line-width": 6,
          "line-opacity": 0.75,
        },
      });
      map.addLayer({
        id: "trail-route-line",
        type: "line",
        source: "trail-route",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#b0904f",
          "line-width": 3.5,
          "line-dasharray": [0.05, 1.2],
        },
      });
    },
    [wineries]
  );

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

    const syncMarkersAndRoute = () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = wineries.map((w) => {
        const el = createMarkerElement(w.id, w.status !== "not_visited");
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
      drawRoute(map);
    };

    if (map.isStyleLoaded()) {
      syncMarkersAndRoute();
    } else {
      map.once("load", syncMarkersAndRoute);
    }

    return () => {
      markersRef.current.forEach((m) => m.remove());
    };
  }, [wineries, drawRoute]);

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
