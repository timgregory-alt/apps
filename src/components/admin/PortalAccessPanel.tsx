"use client";

import { useState, useTransition } from "react";
import { X, RotateCw } from "lucide-react";
import {
  inviteWineryStaffAction,
  revokeWineryStaffAction,
  resendWineryStaffInviteAction,
} from "@/app/admin/wineries/actions";
import type { WineryStaffAccount } from "@/lib/admin";

export function PortalAccessPanel({
  wineryId,
  staff,
}: {
  wineryId: string;
  staff: WineryStaffAccount[];
}) {
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function invite() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await inviteWineryStaffAction(wineryId, email);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setMessage(`Invite sent to ${email}`);
      setEmail("");
    });
  }

  function resend(s: WineryStaffAccount) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await resendWineryStaffInviteAction(wineryId, s.id);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setMessage(`Sign-in link resent to ${s.email}`);
    });
  }

  function revoke(profileId: string) {
    startTransition(async () => {
      await revokeWineryStaffAction(wineryId, profileId);
    });
  }

  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
      <p className="text-sm font-medium text-[var(--color-charcoal)]">Portal Access</p>
      <p className="mt-1 text-xs text-[var(--color-charcoal)]/55">
        Accounts invited here can sign in at /portal to manage this winery&rsquo;s events, hours, links, and
        see aggregate repeat-guest stats — nothing outside their own winery.
      </p>

      {staff.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          {staff.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-line)] px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-[var(--color-charcoal)]">{s.email}</p>
                {s.name && <p className="truncate text-xs text-[var(--color-charcoal)]/50">{s.name}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => resend(s)}
                  disabled={pending}
                  aria-label={`Resend sign-in link to ${s.email}`}
                  title="Resend sign-in link"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--color-charcoal)]/40 hover:bg-black/5 hover:text-[var(--color-burgundy)]"
                >
                  <RotateCw size={13} strokeWidth={2} />
                </button>
                <button
                  type="button"
                  onClick={() => revoke(s.id)}
                  disabled={pending}
                  aria-label={`Revoke access for ${s.email}`}
                  title="Revoke access"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--color-charcoal)]/40 hover:bg-black/5 hover:text-[var(--color-burgundy)]"
                >
                  <X size={14} strokeWidth={2} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="contact@winery.com"
          className="h-10 flex-1 rounded-lg border border-[var(--color-line)] bg-white px-2.5 text-sm outline-none focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold)]/25"
        />
        <button
          type="button"
          onClick={invite}
          disabled={pending || !email.trim()}
          className="h-10 shrink-0 rounded-full bg-[var(--color-charcoal)] px-4 text-xs font-medium text-white disabled:opacity-60"
        >
          {pending ? "Sending…" : "Invite"}
        </button>
      </div>
      <p className="mt-2 text-xs text-[var(--color-charcoal)]/45">
        If someone&rsquo;s already listed above but never finished signing in, use the resend icon next to
        their name instead of re-inviting the same email.
      </p>
      {error && <p className="mt-2 text-xs text-[var(--color-burgundy)]">{error}</p>}
      {message && <p className="mt-2 text-xs text-[var(--color-charcoal)]/60">{message}</p>}
    </div>
  );
}
