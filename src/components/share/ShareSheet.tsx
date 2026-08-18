"use client";

import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Download, Link2, Share2, Check } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { ShareGraphic } from "@/components/share/ShareGraphic";
import { FacebookIcon, InstagramIcon } from "@/components/ui/BrandIcons";

export function ShareSheet({
  open,
  onClose,
  wineryId,
  headline,
  subheadline,
  tagline,
  visited,
  total,
  shareUrl,
  checklist,
}: {
  open: boolean;
  onClose: () => void;
  wineryId: string | null;
  headline: string;
  subheadline: string;
  tagline?: string;
  visited: number;
  total: number;
  shareUrl: string;
  checklist?: string[];
}) {
  const graphicRef = useRef<HTMLDivElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!open || !graphicRef.current) return;
    let cancelled = false;
    setGenerating(true);
    toPng(graphicRef.current, { pixelRatio: 1 })
      .then((url) => !cancelled && setImageUrl(url))
      .catch(() => !cancelled && setImageUrl(null))
      .finally(() => !cancelled && setGenerating(false));
    return () => {
      cancelled = true;
    };
  }, [open]);

  function track(shareType: string) {
    fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wineryId, shareType }),
      keepalive: true,
    }).catch(() => {});
  }

  async function handleNativeShare() {
    track("native_share");
    try {
      if (imageUrl && navigator.canShare) {
        const blob = await (await fetch(imageUrl)).blob();
        const file = new File([blob], "tennessee-wine-trails.png", { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "Tennessee Wine Trails",
            text: `${subheadline} — ${shareUrl}`,
          });
          return;
        }
      }
      if (navigator.share) {
        await navigator.share({ title: "Tennessee Wine Trails", text: subheadline, url: shareUrl });
      }
    } catch {
      // user cancelled — no-op
    }
  }

  function handleSave() {
    track("save_image");
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = "tennessee-wine-trails.png";
    a.click();
  }

  async function handleCopyLink() {
    track("copy_link");
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleFacebook() {
    track("facebook");
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=600");
  }

  function handleInstagram() {
    track("instagram");
    handleNativeShare();
  }

  return (
    <Sheet open={open} onClose={onClose} labelledBy="share-sheet-title">
      <h2 id="share-sheet-title" className="font-serif-display text-center text-xl text-[var(--color-charcoal)]">
        Share Your Visit
      </h2>

      <div className="relative mx-auto mt-4 aspect-[9/16] w-40 overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-charcoal)] shadow-lg">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="Your Tennessee Wine Trails share graphic" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-white/50">
            {generating ? "Preparing your graphic…" : ""}
          </div>
        )}
      </div>

      {/* Off-screen full-resolution render target for html-to-image */}
      <div className="pointer-events-none fixed -left-[9999px] top-0 opacity-0" aria-hidden="true">
        <ShareGraphic
          ref={graphicRef}
          headline={headline}
          subheadline={subheadline}
          tagline={tagline}
          visited={visited}
          total={total}
          checklist={checklist}
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2.5">
        <Button variant="primary" onClick={handleNativeShare} className="col-span-2">
          <Share2 size={16} strokeWidth={2} />
          Share
        </Button>
        <Button variant="outline" onClick={handleSave}>
          <Download size={16} strokeWidth={2} />
          Save Image
        </Button>
        <Button variant="outline" onClick={handleCopyLink}>
          {copied ? <Check size={16} strokeWidth={2} /> : <Link2 size={16} strokeWidth={2} />}
          {copied ? "Copied" : "Copy Link"}
        </Button>
        <Button variant="outline" onClick={handleFacebook}>
          <FacebookIcon size={16} strokeWidth={2} />
          Facebook
        </Button>
        <Button variant="outline" onClick={handleInstagram}>
          <InstagramIcon size={16} strokeWidth={2} />
          Instagram
        </Button>
      </div>
    </Sheet>
  );
}
