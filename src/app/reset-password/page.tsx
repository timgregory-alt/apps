"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { AuthField, AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Account Recovery"
      title="Reset Password"
      subtitle="We'll email you a link to choose a new password."
      footer={
        <Link href="/login" className="font-medium text-[var(--color-burgundy)] hover:underline">
          Back to sign in
        </Link>
      }
    >
      {!isSupabaseConfigured && (
        <p className="mb-4 rounded-xl bg-[var(--color-gold-pale)]/50 px-4 py-3 text-sm text-[var(--color-charcoal)]/70">
          Supabase isn&rsquo;t configured yet. See the README to enable authentication.
        </p>
      )}
      {sent ? (
        <p className="rounded-xl bg-[var(--color-gold-pale)]/50 px-4 py-4 text-center text-sm text-[var(--color-charcoal)]/75">
          Check {email} for a password reset link.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            {loading ? "Sending…" : "Send Reset Link"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
