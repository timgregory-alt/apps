"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StarRating } from "@/components/ui/StarRating";
import { submitAppRatingAction } from "@/app/profile/actions";
import { LOW_RATING_THRESHOLD } from "@/lib/appRating";

export function AppRatingCard({
  initialRating,
  initialFeedback,
}: {
  initialRating: number;
  initialFeedback: string;
}) {
  const [rating, setRating] = useState(initialRating);
  const [feedback, setFeedback] = useState(initialFeedback);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function rate(value: number) {
    setRating(value);
    setSaved(false);
  }

  const feedbackRequired = rating > 0 && rating < LOW_RATING_THRESHOLD;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (feedbackRequired && !feedback.trim()) {
      setError("Please let us know what went wrong so we can improve.");
      return;
    }

    startTransition(async () => {
      try {
        await submitAppRatingAction(rating, feedback);
        setSaved(true);
        setRating(0);
        setFeedback("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not submit your rating");
      }
    });
  }

  return (
    <Card className="flex flex-col items-center gap-3 p-5 text-center">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-charcoal)]/45">
        Enjoying the App?
      </p>
      <p className="text-sm text-[var(--color-charcoal)]/70">
        {rating > 0 ? "Your rating" : "Let us know how we're doing"}
      </p>
      <StarRating value={rating} onRate={rate} disabled={isPending} />

      {saved && !error && (
        <p className="text-sm text-[var(--color-gold)]">
          Thanks for the feedback! Rate us again anytime.
        </p>
      )}

      {rating > 0 && (
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2">
          {feedbackRequired && (
            <p className="text-left text-xs font-medium text-[var(--color-burgundy)]">
              What went wrong? Let us know so we can fix it.
            </p>
          )}
          <textarea
            value={feedback}
            onChange={(e) => {
              setFeedback(e.target.value);
              setSaved(false);
            }}
            placeholder={
              feedbackRequired ? "Tell us what went wrong…" : "Anything you'd like to tell us? (optional)"
            }
            required={feedbackRequired}
            rows={2}
            className="w-full resize-y rounded-xl border border-[var(--color-line)] bg-white/70 px-3 py-2 text-sm text-[var(--color-charcoal)] outline-none placeholder:text-[var(--color-charcoal)]/40 focus:border-[var(--color-gold)]"
          />
          {error && <p className="text-sm text-[var(--color-burgundy)]">{error}</p>}
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "Submitting…" : "Submit Rating"}
          </Button>
        </form>
      )}
    </Card>
  );
}
