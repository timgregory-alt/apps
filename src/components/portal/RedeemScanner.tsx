"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import jsQR from "jsqr";
import { Camera, CheckCircle2, Keyboard, XCircle } from "lucide-react";
import { verifyRedemptionCodeAction, type VerifyRedemptionResult } from "@/app/portal/redeem/actions";
import { formatDateTime } from "@/lib/utils";

/** Pulls a redemption code out of either a bare code (manual entry) or the
 * full QR payload, which encodes a URL like ".../redeem/7K4RXQ9M". */
function extractCode(raw: string): string {
  const trimmed = raw.trim();
  const match = trimmed.match(/\/redeem\/([A-Z0-9]+)/i);
  return (match ? match[1] : trimmed).toUpperCase();
}

export function RedeemScanner() {
  const [mode, setMode] = useState<"camera" | "manual">("camera");
  const [manualCode, setManualCode] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [result, setResult] = useState<VerifyRedemptionResult | null>(null);
  const [pending, startTransition] = useTransition();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const scanningRef = useRef(true);

  const submitCode = useCallback((raw: string) => {
    const code = extractCode(raw);
    if (!code) return;
    scanningRef.current = false;
    startTransition(async () => {
      const res = await verifyRedemptionCodeAction(code);
      setResult(res);
    });
  }, []);

  useEffect(() => {
    if (mode !== "camera" || result) return;
    scanningRef.current = true;
    let cancelled = false;

    function tick() {
      if (!scanningRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const found = jsQR(imageData.data, imageData.width, imageData.height);
          if (found?.data) {
            submitCode(found.data);
            return;
          }
        }
      }
      frameRef.current = requestAnimationFrame(tick);
    }

    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        frameRef.current = requestAnimationFrame(tick);
      })
      .catch(() => setCameraError("Camera access was denied or isn't available on this device."));

    return () => {
      cancelled = true;
      scanningRef.current = false;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [mode, result, submitCode]);

  function reset() {
    setResult(null);
    setManualCode("");
    setCameraError(null);
  }

  if (result) {
    return (
      <div className="rounded-2xl border border-[var(--color-line)] bg-white p-6">
        {result.error ? (
          <div className="flex flex-col items-center gap-2 text-center">
            <XCircle size={28} className="text-[var(--color-burgundy)]" />
            <p className="text-sm font-medium text-[var(--color-charcoal)]">{result.error}</p>
          </div>
        ) : result.alreadyVerified ? (
          <div className="flex flex-col items-center gap-2 text-center">
            <XCircle size={28} className="text-[var(--color-burgundy)]" />
            <p className="text-sm font-medium text-[var(--color-charcoal)]">
              Already redeemed — do not honor again
            </p>
            <p className="font-mono text-base tracking-[0.25em] text-[var(--color-charcoal)]/70">
              {result.code}
            </p>
            <p className="text-xs text-[var(--color-charcoal)]/55">
              {result.tierLabel} · {result.discountText}
            </p>
            {result.verifiedAt && (
              <p className="text-xs text-[var(--color-charcoal)]/45">
                First redeemed {formatDateTime(result.verifiedAt)}
                {result.verifiedAtWineryName ? ` at ${result.verifiedAtWineryName}` : ""}
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center">
            <CheckCircle2 size={28} className="text-[var(--color-gold)]" />
            <p className="text-sm font-medium text-[var(--color-charcoal)]">Valid — go ahead and honor it</p>
            <p className="font-mono text-base tracking-[0.25em] text-[var(--color-charcoal)]/70">
              {result.code}
            </p>
            <p className="text-xs text-[var(--color-charcoal)]/55">
              {result.tierLabel} · {result.discountText}
            </p>
            <p className="text-[0.68rem] text-[var(--color-charcoal)]/40">
              Cannot be combined with other offers or discounts.
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={reset}
          className="mt-5 h-10 w-full rounded-full bg-[var(--color-charcoal)] text-sm font-medium text-white"
        >
          Scan Another Code
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("camera")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium ${
            mode === "camera"
              ? "bg-[var(--color-charcoal)] text-white"
              : "border border-[var(--color-line)] text-[var(--color-charcoal)]/60"
          }`}
        >
          <Camera size={15} strokeWidth={2} />
          Scan QR
        </button>
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium ${
            mode === "manual"
              ? "bg-[var(--color-charcoal)] text-white"
              : "border border-[var(--color-line)] text-[var(--color-charcoal)]/60"
          }`}
        >
          <Keyboard size={15} strokeWidth={2} />
          Type Code
        </button>
      </div>

      {mode === "camera" ? (
        <div className="mt-4">
          {cameraError ? (
            <p className="rounded-xl bg-[var(--color-gold-pale)]/30 p-4 text-center text-sm text-[var(--color-charcoal)]/70">
              {cameraError} Use &ldquo;Type Code&rdquo; instead.
            </p>
          ) : (
            <div className="relative overflow-hidden rounded-xl bg-black">
              <video ref={videoRef} muted playsInline className="aspect-square w-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />
              <div className="pointer-events-none absolute inset-6 rounded-2xl border-2 border-white/60" />
            </div>
          )}
          <p className="mt-3 text-center text-xs text-[var(--color-charcoal)]/50">
            Point the camera at the guest&rsquo;s QR code.
          </p>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitCode(manualCode);
          }}
          className="mt-4 flex flex-col gap-3"
        >
          <input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="e.g. 7K4RXQ9M"
            autoCapitalize="characters"
            autoComplete="off"
            className="rounded-xl border border-[var(--color-line)] bg-[var(--color-ivory)] px-4 py-3 text-center font-mono text-lg tracking-[0.2em] text-[var(--color-charcoal)] outline-none focus:border-[var(--color-gold)]"
          />
          <button
            type="submit"
            disabled={pending || !manualCode.trim()}
            className="h-11 w-full rounded-full bg-[var(--color-burgundy)] text-sm font-medium text-white disabled:opacity-60"
          >
            {pending ? "Checking…" : "Check Code"}
          </button>
        </form>
      )}
    </div>
  );
}
