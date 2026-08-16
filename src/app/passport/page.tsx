import { getCurrentUser, getWineriesWithStatus, getWinesWithTastings } from "@/lib/data";
import { visitedCount, isTrailComplete } from "@/lib/trail";
import { Header } from "@/components/layout/Header";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { PassportEntry } from "@/components/passport/PassportEntry";
import { CompletionBanner } from "@/components/completion/CompletionBanner";
import { WineTastingSection } from "@/components/tasting/WineTastingSection";

export default async function PassportPage() {
  const user = await getCurrentUser();
  const [wineries, wines] = await Promise.all([
    getWineriesWithStatus(user?.id ?? null),
    getWinesWithTastings(user?.id ?? null),
  ]);
  const visited = visitedCount(wineries);
  const complete = isTrailComplete(wineries);

  return (
    <main className="mx-auto flex max-w-md flex-col gap-8 pb-10">
      <Header eyebrow="Tennessee Wine Passport" title="Your Tennessee Wine Passport" />

      <div className="mx-auto w-full max-w-md px-6">
        <div className="flex items-baseline justify-between">
          <p className="font-serif-display text-lg text-[var(--color-charcoal)]">
            {visited} of {wineries.length} Stops Complete
          </p>
        </div>
        <ProgressBar value={visited} max={wineries.length} className="mt-3" />
      </div>

      {complete && (
        <div className="mx-auto w-full max-w-md px-6">
          <CompletionBanner />
        </div>
      )}

      <div className="mx-auto flex w-full max-w-md flex-col gap-3 px-6">
        {wineries.map((w) => (
          <PassportEntry key={w.id} winery={w} />
        ))}
      </div>

      <div className="mx-auto w-full max-w-md px-6">
        <div className="gold-divider mb-8" />
        <WineTastingSection wines={wines} wineries={wineries} />
      </div>
    </main>
  );
}
