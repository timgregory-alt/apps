"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

/** A centered confirmation dialog matching AuthModal's positioning and card
 * styling (fixed, centered, texture-grain ivory card) — unlike AuthModal,
 * this one is dismissible via backdrop click or Escape, since it's used for
 * confirmations a guest can back out of. */
export function CenteredDialog({
  open,
  onClose,
  labelledBy,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (typeof document === "undefined" || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[var(--color-charcoal)]/40 p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      onClick={onClose}
    >
      <div
        className="texture-grain relative w-full max-w-[300px] rounded-3xl bg-[var(--color-ivory)] px-5 py-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
