"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { AuthField } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { DateOfBirthInput } from "@/components/ui/DateOfBirthInput";
import { calculateAge } from "@/lib/utils";

const MIN_AGE = 21;

/** Mandatory, non-dismissible sign-in/sign-up modal shown over a page's real
 * (preview) content for signed-out guests. No close button and no
 * backdrop-click dismissal by design — the app requires an account to use.
 * On success it just refreshes the current route (no redirect) so the guest
 * lands back on the exact page they were previewing, now unlocked. */
export function AuthModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referredBy = searchParams.get("ref");

  const [mode, setMode] = useState<"signin" | "signup">("signup");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[var(--color-charcoal)]/45 p-5 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="texture-grain relative max-h-[80vh] w-full max-w-sm overflow-y-auto rounded-3xl bg-[var(--color-ivory)] px-6 py-7 shadow-2xl">
        <div className="relative mb-6 text-center">
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.28em] text-[var(--color-gold)]">
            Tennessee Wine Trails
          </p>
          <h2
            id="auth-modal-title"
            className="font-serif-display mt-1 text-2xl text-[var(--color-charcoal)]"
          >
            {mode === "signup" ? "Create Your Account" : "Welcome Back"}
          </h2>
          <p className="mt-2 text-sm text-[var(--color-charcoal)]/60">
            {mode === "signup"
              ? "Sign up free to check in, rate wines, and earn rewards across the trail."
              : "Sign in to continue your Tennessee wine adventure."}
          </p>
        </div>

        {!isSupabaseConfigured && (
          <p className="mb-4 rounded-xl bg-[var(--color-gold-pale)]/50 px-4 py-3 text-sm text-[var(--color-charcoal)]/70">
            Supabase isn&rsquo;t configured yet — authentication will work once environment
            variables are set. See the README.
          </p>
        )}

        {mode === "signup" ? (
          <SignupFields referredBy={referredBy} onDone={() => router.refresh()} />
        ) : (
          <SigninFields onDone={() => router.refresh()} />
        )}

        <p className="mt-6 text-center text-sm text-[var(--color-charcoal)]/65">
          {mode === "signup" ? (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="font-medium text-[var(--color-burgundy)] hover:underline"
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              New here?{" "}
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="font-medium text-[var(--color-burgundy)] hover:underline"
              >
                Create an account
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

function SigninFields({ onDone }: { onDone: () => void }) {
  const [subMode, setSubMode] = useState<"password" | "magic">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicSent, setMagicSent] = useState(false);

  async function handlePasswordSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const redirectTo = typeof window !== "undefined" ? window.location.pathname : "/";
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
        },
      });
      if (error) throw error;
      setMagicSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send magic link.");
    } finally {
      setLoading(false);
    }
  }

  if (subMode === "magic") {
    return (
      <form onSubmit={handleMagicLink} className="flex flex-col gap-4">
        {magicSent ? (
          <p className="rounded-xl bg-[var(--color-gold-pale)]/50 px-4 py-4 text-center text-sm text-[var(--color-charcoal)]/75">
            Check {email} for a link to sign in.
          </p>
        ) : (
          <>
            <AuthField
              label="Email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error && <p className="text-sm text-[var(--color-burgundy)]">{error}</p>}
            <Button type="submit" size="lg" fullWidth disabled={loading}>
              {loading ? "Sending…" : "Email Me a Magic Link"}
            </Button>
          </>
        )}
        <Button type="button" variant="ghost" fullWidth onClick={() => setSubMode("password")}>
          Use password instead
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handlePasswordSignIn} className="flex flex-col gap-4">
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
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <p className="text-sm text-[var(--color-burgundy)]">{error}</p>}
      <Button type="submit" size="lg" fullWidth disabled={loading}>
        {loading ? "Signing in…" : "Sign In"}
      </Button>
      <Button type="button" variant="ghost" fullWidth onClick={() => setSubMode("magic")}>
        <Mail size={16} />
        Use a magic link instead
      </Button>
    </form>
  );
}

function SignupFields({
  referredBy,
  onDone,
}: {
  referredBy: string | null;
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [zipCode, setZipCode] = useState("");
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
      setError(`You must be ${MIN_AGE} or older to create a Tennessee Wine Trails account.`);
      return;
    }
    if (!/^\d{5}(-\d{4})?$/.test(zipCode.trim())) {
      setError("Please enter a valid zip code.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const redirectTo = typeof window !== "undefined" ? window.location.pathname : "/";
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            birth_date: birthDate,
            zip_code: zipCode.trim(),
            referred_by: referredBy || undefined,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
        },
      });
      if (error) throw error;

      if (data.session) {
        onDone();
      } else {
        setConfirmSent(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create your account.");
    } finally {
      setLoading(false);
    }
  }

  if (confirmSent) {
    return (
      <p className="rounded-xl bg-[var(--color-gold-pale)]/50 px-4 py-4 text-center text-sm text-[var(--color-charcoal)]/75">
        Check {email} to confirm your account and start your trail.
      </p>
    );
  }

  return (
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
      <AuthField
        label="Zip Code"
        type="text"
        required
        inputMode="numeric"
        autoComplete="postal-code"
        maxLength={10}
        value={zipCode}
        onChange={(e) => setZipCode(e.target.value)}
      />
      {error && <p className="text-sm text-[var(--color-burgundy)]">{error}</p>}
      <Button type="submit" size="lg" fullWidth disabled={loading}>
        {loading ? "Creating your account…" : "Create Account"}
      </Button>
    </form>
  );
}
