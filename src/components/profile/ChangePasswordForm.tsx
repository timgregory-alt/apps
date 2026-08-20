"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const inputClass =
  "h-12 rounded-xl border border-[var(--color-line)] bg-white/70 px-4 text-[var(--color-charcoal)] outline-none transition-colors placeholder:text-[var(--color-charcoal)]/35 focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold)]/25";

export function ChangePasswordForm() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSaved(true);
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update your password.");
    } finally {
      setLoading(false);
    }
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
          Change Password
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
            <span className="font-medium text-[var(--color-charcoal)]/80">New Password</span>
            <input
              type="password"
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setSaved(false);
              }}
              required
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-[var(--color-charcoal)]/80">Confirm New Password</span>
            <input
              type="password"
              minLength={6}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setSaved(false);
              }}
              required
              className={inputClass}
            />
          </label>
          {error && <p className="text-sm text-[var(--color-burgundy)]">{error}</p>}
          {saved && !error && <p className="text-sm text-[var(--color-gold)]">Password updated.</p>}
          <Button type="submit" disabled={loading}>
            {loading ? "Updating…" : "Update Password"}
          </Button>
        </form>
      )}
    </Card>
  );
}
