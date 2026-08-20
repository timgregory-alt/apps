"use client";

import { useState, useTransition } from "react";
import { ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DateOfBirthInput } from "@/components/ui/DateOfBirthInput";
import { updateProfileAction } from "@/app/profile/actions";
import { cn } from "@/lib/utils";

const inputClass =
  "h-12 rounded-xl border border-[var(--color-line)] bg-white/70 px-4 text-[var(--color-charcoal)] outline-none transition-colors placeholder:text-[var(--color-charcoal)]/35 focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold)]/25";

export function AccountInfoForm({
  initialName,
  initialEmail,
  initialZipCode,
  initialBirthDate,
  birthDateLocked,
}: {
  initialName: string;
  initialEmail: string;
  initialZipCode: string;
  initialBirthDate: string;
  birthDateLocked: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [zipCode, setZipCode] = useState(initialZipCode);
  const [birthDate, setBirthDate] = useState(initialBirthDate);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [emailChangePending, setEmailChangePending] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setEmailChangePending(false);
    startTransition(async () => {
      try {
        const result = await updateProfileAction({ name, birth_date: birthDate, email, zip_code: zipCode });
        setSaved(true);
        setEmailChangePending(!!result?.emailChangePending);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save your info");
      }
    });
  }

  return (
    <Card className={cn("flex flex-col p-5", open && "gap-4")}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between gap-2"
        aria-expanded={open}
      >
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-charcoal)]/45">
          Account Info
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
      {open && (
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
            <span className="font-medium text-[var(--color-charcoal)]/80">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setSaved(false);
              }}
              required
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-[var(--color-charcoal)]/80">Zip Code</span>
            <input
              type="text"
              inputMode="numeric"
              maxLength={10}
              value={zipCode}
              onChange={(e) => {
                setZipCode(e.target.value);
                setSaved(false);
              }}
              required
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-[var(--color-charcoal)]/80">Date of Birth</span>
            <DateOfBirthInput
              value={birthDate}
              onChange={(v) => {
                setBirthDate(v);
                setSaved(false);
              }}
              disabled={birthDateLocked}
            />
            {birthDateLocked && (
              <span className="text-xs text-[var(--color-charcoal)]/50">
                Your birthday can only be set once and is now locked. Contact us if it needs correcting.
              </span>
            )}
          </label>
          {error && <p className="text-sm text-[var(--color-burgundy)]">{error}</p>}
          {saved && !error && !emailChangePending && (
            <p className="text-sm text-[var(--color-gold)]">Saved.</p>
          )}
          {saved && !error && emailChangePending && (
            <p className="text-sm text-[var(--color-gold)]">
              Saved. Check {email} to confirm your new email address.
            </p>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : "Save Changes"}
          </Button>
        </form>
      )}
    </Card>
  );
}
