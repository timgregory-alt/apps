"use client";

import { useEffect, useRef } from "react";

/** Fixed, full-viewport looping video behind the Explore page's content.
 * Muted/autoplay/playsInline so mobile browsers allow it without a user
 * gesture. Paused (falls back to the poster frame) for guests who prefer
 * reduced motion. Heavily blurred and scaled up so the source footage
 * (a close-up hand/glass shot, not a landscape) reads as a soft, shifting
 * wash of vineyard greens and wine reds instead of a literal scene — and a
 * scrim overlay on top keeps card/text contrast readable. */
export function VineyardVideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) videoRef.current?.pause();
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <video
        ref={videoRef}
        className="h-full w-full scale-110 object-cover blur-2xl"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/video/explore-vineyard-poster.jpg"
      >
        <source src="/video/explore-vineyard.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-[var(--color-ivory)]/62" />
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-ivory)] via-transparent to-[var(--color-ivory)]" />
    </div>
  );
}
