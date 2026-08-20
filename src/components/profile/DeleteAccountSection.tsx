"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { deleteAccountAction } from "@/app/profile/actions";
import { cn } from "@/lib/utils";

export function DeleteAccountSection() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canDelete = confirmText.trim().toUpperCase() === "DELETE";

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteAccountAction();
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.push("/");
      router.refresh();
    });
  }

  return (
    <Card className={cn("flex flex-col border-[var(--color-burgundy)]/25 p-5", open && "gap-4")}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between gap-2"
        aria-expanded={open}
      >
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-burgundy)]">
          Delete Account
        </span>
        <ChevronDown
          size={15}
          strokeWidth={2.5}
          className={cn(
            "shrink-0 text-[var(--color-burgundy)]/60 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-[var(--color-charcoal)]/70">
            This permanently deletes your account, trail progress, check-ins, ratings, and
            rewards. This can&rsquo;t be undone.
          </p>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-[var(--color-charcoal)]/80">
              Type DELETE to confirm
            </span>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="h-12 rounded-xl border border-[var(--color-line)] bg-white/70 px-4 text-[var(--color-charcoal)] outline-none transition-colors focus:border-[var(--color-burgundy)] focus:ring-2 focus:ring-[var(--color-burgundy)]/25"
            />
          </label>
          {error && <p className="text-sm text-[var(--color-burgundy)]">{error}</p>}
          <Button
            type="button"
            variant="outline"
            onClick={handleDelete}
            disabled={!canDelete || isPending}
            className="border-[var(--color-burgundy)] text-[var(--color-burgundy)] hover:bg-[var(--color-burgundy)]/5"
          >
            {isPending ? "Deleting…" : "Permanently Delete My Account"}
          </Button>
        </div>
      )}
    </Card>
  );
}
