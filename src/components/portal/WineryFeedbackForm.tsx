"use client";

import { useState, useTransition } from "react";
import { submitWineryFeedbackAction } from "@/app/portal/feedback/actions";
import { Button } from "@/components/ui/Button";

export function WineryFeedbackForm() {
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitWineryFeedbackAction(feedback);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setFeedback("");
      setSent(true);
      setTimeout(() => setSent(false), 4000);
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Tell us what's working, what's not, or what you'd like to see next…"
        rows={4}
        className="w-full rounded-xl border border-[var(--color-line)] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold)]/25"
      />
      {error && <p className="text-xs text-[var(--color-burgundy)]">{error}</p>}
      {sent && <p className="text-xs text-[var(--color-charcoal)]/55">Sent — thanks for the feedback.</p>}
      <Button type="submit" disabled={pending || !feedback.trim()} className="self-start">
        {pending ? "Sending…" : "Send Feedback"}
      </Button>
    </form>
  );
}
