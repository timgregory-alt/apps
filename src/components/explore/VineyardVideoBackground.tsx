"use client";

import { useEffect, useRef } from "react";

/** Fixed, full-viewport looping video behind the Explore page's content.
 * Muted/autoplay/playsInline so mobile browsers allow it without a user
 * gesture. Paused (falls back to the poster frame) for guests who prefer
 * reduced motion. Heavily blurred and scaled up so the source footage
 * (a close-up hand/glass shot, not a landscape) reads as a soft, shifting
 * wash of vineyard greens and wine reds instead of a literal scene. No
 * scrim overlay — the video shows through at full strength; cards rely on
 * their own translucent white background for text contrast. */
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
    </div>
  );
}
