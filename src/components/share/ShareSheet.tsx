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
  // Prepared ahead of time, not inside a share click handler — iOS Safari
  // requires navigator.share() to run synchronously within the original tap,
  // with no `await` before it, or it silently rejects the call. Converting
  // the rendered PNG into a File is itself async, so it has to happen here
  // in the background while the sheet is open, not on demand when tapped.
  const [shareFile, setShareFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [instagramNote, setInstagramNote] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !graphicRef.current) return;
    let cancelled = false;
    setGenerating(true);
    setShareFile(null);
    toPng(graphicRef.current, { pixelRatio: 1 })
      .then((url) => {
        if (cancelled) return;
        setImageUrl(url);
        return fetch(url)
          .then((res) => res.blob())
          .then((blob) => {
            if (!cancelled) {
              setShareFile(new File([blob], "tennessee-wine-trails.png", { type: "image/png" }));
            }
          });
      })
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
      if (shareFile && navigator.canShare?.({ files: [shareFile] })) {
        await navigator.share({
          files: [shareFile],
          title: "Tennessee Wine Trails",
          text: `${subheadline} — ${shareUrl}`,
        });
        return;
      }
      if (typeof navigator.share === "function") {
        await navigator.share({ title: "Tennessee Wine Trails", text: subheadline, url: shareUrl });
      }
    } catch {
      // User cancelled, or the browser rejected the request — no-op either way.
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

  // Instagram doesn't offer a public web API for pre-filled posts the way
  // Facebook's sharer.php does — the only real path in is the device's own
  // share sheet (navigator.share), where the guest picks Instagram
  // themselves. That share sheet exists on desktop too (e.g. macOS Safari),
  // but Instagram is never one of its options there — there's no desktop
  // Instagram app registered with the OS, only on iOS/Android. So routing
  // through navigator.share on desktop just shows a share sheet with no
  // Instagram in it, which looks broken. Only use it on an actual phone;
  // everywhere else, save the image and copy the link so the guest can post
  // it from the Instagram app themselves.
  async function handleInstagram() {
    track("instagram");
    setInstagramNote(null);

    const isMobile =
      typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile && typeof navigator !== "undefined" && typeof navigator.share === "function") {
      await handleNativeShare();
      return;
    }

    handleSave();
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // Image still downloaded — link copy is a bonus, not required.
    }
    setInstagramNote("Photo saved & link copied — open Instagram and share it from there.");
    setTimeout(() => setInstagramNote(null), 5000);
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

      {instagramNote && (
        <p role="status" className="mt-3 text-center text-xs text-[var(--color-charcoal)]/60">
          {instagramNote}
        </p>
      )}
    </Sheet>
  );
}
