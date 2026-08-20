"use client";

import { useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { Bug, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { submitBugReportAction } from "@/app/profile/actions";
import { cn } from "@/lib/utils";

export function BugReportCard() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitBugReportAction(description, pathname);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setSubmitted(true);
      setDescription("");
    });
  }

  return (
    <Card className={cn("flex flex-col p-5", open && "gap-3")}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between gap-2"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-charcoal)]/45">
          <Bug size={14} className="text-[var(--color-charcoal)]/40" />
          Report a Bug
        </span>
        <ChevronDown
          size={15}
          strokeWidth={2.5}
          className={cn(
            "shrink-0 text-[var(--color-charcoal)]/45 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open &&
        (submitted ? (
          <p className="text-sm text-[var(--color-gold)]">
            Thanks — we&apos;ve got your report and will look into it.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What happened? The more detail, the better."
              rows={3}
              required
              className="w-full resize-y rounded-xl border border-[var(--color-line)] bg-white/70 px-3 py-2 text-sm text-[var(--color-charcoal)] outline-none placeholder:text-[var(--color-charcoal)]/40 focus:border-[var(--color-gold)]"
            />
            {error && <p className="text-sm text-[var(--color-burgundy)]">{error}</p>}
            <Button type="submit" size="sm" variant="outline" disabled={isPending || !description.trim()}>
              {isPending ? "Sending…" : "Send Report"}
            </Button>
          </form>
        ))}
    </Card>
  );
}
