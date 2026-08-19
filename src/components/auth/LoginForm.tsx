"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { AuthField, AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/my-trail";

  const [mode, setMode] = useState<"password" | "magic">("password");
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
      router.push(redirectTo);
      router.refresh();
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

  return (
    <AuthShell
      eyebrow="Welcome Back"
      title="Sign In"
      subtitle="Continue your Tennessee wine adventure."
      footer={
        <>
          New here?{" "}
          <Link href="/signup" className="font-medium text-[var(--color-burgundy)] hover:underline">
            Create an account
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

      {mode === "password" ? (
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
          <div className="-mt-2 text-right">
            <Link href="/reset-password" className="text-xs text-[var(--color-charcoal)]/55 hover:text-[var(--color-burgundy)]">
              Forgot password?
            </Link>
          </div>
          {error && <p className="text-sm text-[var(--color-burgundy)]">{error}</p>}
          <Button type="submit" size="lg" fullWidth disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </Button>
          <Button type="button" variant="ghost" fullWidth onClick={() => setMode("magic")}>
            <Mail size={16} />
            Use a magic link instead
          </Button>
        </form>
      ) : (
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
          <Button type="button" variant="ghost" fullWidth onClick={() => setMode("password")}>
            Use password instead
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
