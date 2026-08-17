"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function RedeemEntryPage() {
  const router = useRouter();
  const [code, setCode] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed) router.push(`/redeem/${trimmed}`);
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-8 pb-10">
      <Header eyebrow="Winery Redemption" title="Enter a Guest's Code" />

      <div className="px-6">
        <Card className="p-6">
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-charcoal)]/45">
                Redemption Code
              </span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. 7K4RXQ9M"
                autoCapitalize="characters"
                autoComplete="off"
                className="rounded-xl border border-[var(--color-line)] bg-[var(--color-ivory)] px-4 py-3 font-mono text-lg tracking-[0.2em] text-[var(--color-charcoal)] outline-none focus:border-[var(--color-gold)]"
              />
            </label>
            <Button type="submit" disabled={!code.trim()}>
              Look Up Code
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
