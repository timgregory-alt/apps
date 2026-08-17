"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { AuthField, AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { DateOfBirthInput } from "@/components/ui/DateOfBirthInput";
import { calculateAge } from "@/lib/utils";

const MIN_AGE = 21;

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/passport";
  const referredBy = searchParams.get("ref");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!birthDate) {
      setError("Please enter your date of birth.");
      return;
    }
    if (calculateAge(birthDate) < MIN_AGE) {
      setError(`You must be ${MIN_AGE} or older to create a Tennessee Wine Passport account.`);
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, birth_date: birthDate, referred_by: referredBy || undefined },
          emailRedirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
        },
      });
      if (error) throw error;

      if (data.session) {
        router.push(redirectTo);
        router.refresh();
      } else {
        setConfirmSent(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create your passport.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Begin Your Journey"
      title="Create Your Passport"
      subtitle="One account, four wineries, a lifetime of Tennessee wine memories."
      footer={
        <>
          Already have a passport?{" "}
          <Link href="/login" className="font-medium text-[var(--color-burgundy)] hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      {!isSupabaseConfigured && (
        <p className="mb-4 rounded-xl bg-[var(--color-gold-pale)]/50 px-4 py-3 text-sm text-[var(--color-charcoal)]/70">
          Supabase isn&rsquo;t configured yet — authentication will work once environment
          variables are set. See the README.
        </p>
      )}

      {confirmSent ? (
        <p className="rounded-xl bg-[var(--color-gold-pale)]/50 px-4 py-4 text-center text-sm text-[var(--color-charcoal)]/75">
          Check {email} to confirm your account and start your passport.
        </p>
      ) : (
        <form onSubmit={handleSignUp} className="flex flex-col gap-4">
          <AuthField
            label="Name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <AuthField
            label="Email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <AuthField
            label="Password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-[var(--color-charcoal)]/80">Date of Birth</span>
            <DateOfBirthInput value={birthDate} onChange={setBirthDate} required />
          </label>
          <p className="-mt-2 text-xs text-[var(--color-charcoal)]/50">
            You must be {MIN_AGE}+ to join — Tennessee wineries only serve guests {MIN_AGE} and older.
          </p>
          {error && <p className="text-sm text-[var(--color-burgundy)]">{error}</p>}
          <Button type="submit" size="lg" fullWidth disabled={loading}>
            {loading ? "Creating your passport…" : "Create Account"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
