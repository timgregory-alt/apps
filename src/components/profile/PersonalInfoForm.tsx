"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { updateProfileAction } from "@/app/profile/actions";

const inputClass =
  "h-12 rounded-xl border border-[var(--color-line)] bg-white/70 px-4 text-[var(--color-charcoal)] outline-none transition-colors placeholder:text-[var(--color-charcoal)]/35 focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold)]/25";

export function PersonalInfoForm({
  initialName,
  initialBirthDate,
}: {
  initialName: string;
  initialBirthDate: string;
}) {
  const [name, setName] = useState(initialName);
  const [birthDate, setBirthDate] = useState(initialBirthDate);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await updateProfileAction({ name, birth_date: birthDate });
        setSaved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save your info");
      }
    });
  }

  return (
    <Card className="flex flex-col gap-4 p-5">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-charcoal)]/45">
        Personal Info
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-[var(--color-charcoal)]/80">Name</span>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSaved(false);
            }}
            required
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-[var(--color-charcoal)]/80">Date of Birth</span>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => {
              setBirthDate(e.target.value);
              setSaved(false);
            }}
            max={new Date().toISOString().slice(0, 10)}
            className={inputClass}
          />
        </label>
        {error && <p className="text-sm text-[var(--color-burgundy)]">{error}</p>}
        {saved && !error && <p className="text-sm text-[var(--color-gold)]">Saved.</p>}
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save Changes"}
        </Button>
      </form>
    </Card>
  );
}
