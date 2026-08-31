"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthField, AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";

export function UpdatePasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/my-trail";
  const code = searchParams.get("code");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  // A recovery/invite link can land here two ways: a ?code= to exchange
  // (PKCE), or a #access_token= fragment the Supabase client already
  // auto-detects on load — either way there's a moment before a session
  // actually exists, so the form stays hidden until one does.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function establishSession() {
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!cancelled && session) setReady(true);
    }
    establishSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setReady(true);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      setTimeout(() => router.push(next), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update your password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell eyebrow="Account Recovery" title="Choose a New Password">
      {done ? (
        <p className="rounded-xl bg-[var(--color-gold-pale)]/50 px-4 py-4 text-center text-sm text-[var(--color-charcoal)]/75">
          Password updated. Redirecting…
        </p>
      ) : !ready ? (
        <p className="text-center text-sm text-[var(--color-charcoal)]/55">
          Verifying your link…
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <AuthField
            label="New Password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-sm text-[var(--color-burgundy)]">{error}</p>}
          <Button type="submit" size="lg" fullWidth disabled={loading}>
            {loading ? "Updating…" : "Update Password"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
