"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download } from "lucide-react";

const QR_COLORS = { dark: "#24211d", light: "#faf6ee" };

/** Renders a QR code (as an SVG data URI) for a given URL — used for winery
 * tasting-room signage. Pass `downloadable` to also show PNG/SVG download
 * links, for saving the code to attach to a printed banner or card. */
export function QrCode({
  value,
  size = 200,
  downloadable = false,
  filename = "qr-code",
}: {
  value: string;
  size?: number;
  downloadable?: boolean;
  filename?: string;
}) {
  const [svg, setSvg] = useState<string | null>(null);
  const [pngUrl, setPngUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toString(value, { type: "svg", margin: 1, color: QR_COLORS })
      .then((markup) => !cancelled && setSvg(markup))
      .catch(() => !cancelled && setSvg(null));
    return () => {
      cancelled = true;
    };
  }, [value]);

  useEffect(() => {
    if (!downloadable) return;
    let cancelled = false;
    // Rendered well above the on-screen display size so it still looks
    // sharp blown up on a printed banner, not just a business card.
    QRCode.toDataURL(value, { type: "image/png", margin: 1, width: 1024, color: QR_COLORS })
      .then((url) => !cancelled && setPngUrl(url))
      .catch(() => !cancelled && setPngUrl(null));
    return () => {
      cancelled = true;
    };
  }, [value, downloadable]);

  function downloadSvg() {
    if (!svg) return;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

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
    <div className="flex flex-col items-center gap-2.5">
      <div
        style={{ width: size, height: size }}
        className="overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-ivory)] p-2"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      {downloadable && (
        <div className="flex items-center gap-3 text-xs font-medium text-[var(--color-burgundy)]">
          <a
            href={pngUrl ?? undefined}
            download={`${filename}.png`}
            aria-disabled={!pngUrl}
            className="flex items-center gap-1 hover:underline aria-disabled:pointer-events-none aria-disabled:opacity-40"
          >
            <Download size={12} strokeWidth={2} />
            PNG
          </a>
          <button type="button" onClick={downloadSvg} className="flex items-center gap-1 hover:underline">
            <Download size={12} strokeWidth={2} />
            SVG
          </button>
        </div>
      )}
    </div>
  );
}
