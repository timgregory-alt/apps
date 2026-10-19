import { getWineryStaffContext, getWineryFeedback } from "@/lib/portal";
import { formatCheckinDate } from "@/lib/utils";
import { WineryFeedbackForm } from "@/components/portal/WineryFeedbackForm";

export default async function PortalFeedbackPage() {
  const ctx = await getWineryStaffContext();
  if (!ctx) return null;

  const feedback = await getWineryFeedback(ctx.winery.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif-display text-2xl text-[var(--color-charcoal)]">Feedback</h1>
        <p className="mt-1 text-sm text-[var(--color-charcoal)]/55">
          Send feedback about the platform itself — bugs, requests, anything — straight to the trail
          admin.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--color-line)] bg-white p-4">
        <WineryFeedbackForm />
      </div>

      {feedback.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <h2 className="text-sm font-medium text-[var(--color-charcoal)]/70">Previously Sent</h2>
          {feedback.map((f) => (
            <div key={f.id} className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-sm">
              <p className="text-xs text-[var(--color-charcoal)]/45">{formatCheckinDate(f.created_at)}</p>
              <p className="mt-1 text-[var(--color-charcoal)]/80">{f.feedback}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
