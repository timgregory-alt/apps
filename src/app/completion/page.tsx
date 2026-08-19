import { LinkButton } from "@/components/ui/Button";
import { SectionEyebrow } from "@/components/ui/Card";
import { CompletionBadge } from "@/components/completion/CompletionBadge";
import { CompletionShareButton } from "@/components/completion/CompletionShareButton";
import { TrailCoverFrame } from "@/components/ui/TrailCoverFrame";
import { getCurrentUser, getWineriesWithStatus } from "@/lib/data";

export default async function CompletionPage() {
  const user = await getCurrentUser();
  const wineries = await getWineriesWithStatus(user?.id ?? null);

  return (
    <main className="texture-grain relative mx-auto flex min-h-[calc(100dvh-6rem)] max-w-md flex-col items-center justify-center gap-8 overflow-hidden px-6 py-16 text-center">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(176,144,79,0.12),transparent_55%)]" />
      <TrailCoverFrame />

      <div className="animate-fade-up relative flex flex-col items-center gap-4">
        <SectionEyebrow>Trail Complete</SectionEyebrow>
        <h1 className="font-serif-display text-4xl italic leading-tight text-[var(--color-burgundy)]">
          You did it.
        </h1>
        <p className="max-w-[30ch] text-[var(--color-charcoal)]/70">
          Four wineries. Four stamps. One unforgettable Tennessee wine adventure.
        </p>
      </div>

      <div className="animate-fade-up relative" style={{ animationDelay: "0.15s", opacity: 0 }}>
        <CompletionBadge />
      </div>

      <div
        className="animate-fade-up relative flex w-full flex-col gap-2"
        style={{ animationDelay: "0.3s", opacity: 0 }}
      >
        {wineries.map((w) => (
          <div
            key={w.id}
            className="flex items-center justify-between rounded-xl border border-[var(--color-line)] bg-white/60 px-4 py-2.5 text-sm"
          >
            <span className="text-[var(--color-charcoal)]/80">{w.name}</span>
            <span className="text-[var(--color-gold)]">✓</span>
          </div>
        ))}
      </div>

      <div
        className="animate-fade-up relative flex w-full flex-col gap-2.5"
        style={{ animationDelay: "0.45s", opacity: 0 }}
      >
        <CompletionShareButton wineryNames={wineries.map((w) => w.name)} />
        <LinkButton href="/my-trail" variant="outline" fullWidth>
          Back to My Trail
        </LinkButton>
      </div>
    </main>
  );
}
