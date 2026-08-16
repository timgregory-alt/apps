"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

/** Renders a QR code (as an SVG data URI) for a given URL — used for winery tasting-room signage. */
export function QrCode({ value, size = 200 }: { value: string; size?: number }) {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toString(value, { type: "svg", margin: 1, color: { dark: "#24211d", light: "#faf6ee" } })
      .then((markup) => !cancelled && setSvg(markup))
      .catch(() => !cancelled && setSvg(null));
    return () => {
      cancelled = true;
    };
  }, [value]);

  if (!svg) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center rounded-xl bg-black/5 text-xs text-[var(--color-charcoal)]/40"
      >
        Generating…
      </div>
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className="overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-ivory)] p-2"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
