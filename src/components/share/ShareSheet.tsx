"use client";

import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Download, Link2, Share2, Check } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { ShareGraphic } from "@/components/share/ShareGraphic";
import { FacebookIcon, InstagramIcon } from "@/components/ui/BrandIcons";

/** Both the Facebook and Instagram apps register as native share-sheet
 * targets on a phone, but neither reliably does on desktop — Facebook's
 * sharer.php popup gets intercepted by the Facebook app on mobile instead
 * of showing its own share dialog, and there's no desktop Instagram app at
 * all. So mobile routes through navigator.share() for both; desktop keeps
 * Facebook's web popup and falls back to save+copy for Instagram. */
function isMobileDevice(): boolean {
  return typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

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

  // On mobile, opening facebook.com/sharer.php gets intercepted by the
  // Facebook app itself, which just deep-links to whatever it opens to by
  // default instead of showing a share dialog — the popup approach only
  // actually works as intended on desktop, where there's no app to
  // intercept it. On mobile, go through the native share sheet instead,
  // where Facebook reliably shows up as a real target.
  async function handleFacebook() {
    track("facebook");
    if (isMobileDevice()) {
      await handleNativeShare();
      return;
    }
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=600");
  }

  // Instagram doesn't offer a public web API for pre-filled posts the way
  // Facebook's sharer.php does — the only real path in is the device's own
  // share sheet (navigator.share), where the guest picks Instagram
  // themselves, and only with an actual image/video attached — Instagram's
  // iOS share extension doesn't do anything useful with a plain text/link
  // share. So this never falls back to a text-only native share the way
  // handleNativeShare does for the other buttons: without a real photo to
  // hand off, it goes straight to save+copy so the guest has something
  // they can actually post manually.
  async function handleInstagram() {
    track("instagram");
    setInstagramNote(null);

    if (isMobileDevice() && shareFile && navigator.canShare?.({ files: [shareFile] })) {
      try {
        await navigator.share({
          files: [shareFile],
          title: "Tennessee Wine Trails",
          text: `${subheadline} — ${shareUrl}`,
        });
        return;
      } catch {
        // Cancelled or rejected — fall through to the manual-post fallback below.
      }
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
        <Button variant="primary" onClick={handleNativeShare} disabled={generating} className="col-span-2">
          <Share2 size={16} strokeWidth={2} />
          {generating ? "Preparing…" : "Share"}
        </Button>
        <Button variant="outline" onClick={handleSave}>
          <Download size={16} strokeWidth={2} />
          Save Image
        </Button>
        <Button variant="outline" onClick={handleCopyLink}>
          {copied ? <Check size={16} strokeWidth={2} /> : <Link2 size={16} strokeWidth={2} />}
          {copied ? "Copied" : "Copy Link"}
        </Button>
        <Button variant="outline" onClick={handleFacebook} disabled={generating}>
          <FacebookIcon size={16} strokeWidth={2} />
          {generating ? "Preparing…" : "Facebook"}
        </Button>
        <Button variant="outline" onClick={handleInstagram} disabled={generating}>
          <InstagramIcon size={16} strokeWidth={2} />
          {generating ? "Preparing…" : "Instagram"}
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
