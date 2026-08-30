import Link from "next/link";
import { Lock, Sparkles, ExternalLink } from "lucide-react";
import { getCurrentUser, getProfile, getVipEvents } from "@/lib/data";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";

const MONTH_ABBR = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

function formatEventDateParts(isoDate: string): { month: string; day: number } {
  const [, month, day] = isoDate.split("-").map(Number);
  return { month: MONTH_ABBR[month - 1], day };
}

export default async function VipPage() {
  const user = await getCurrentUser();
  const profile = user ? await getProfile(user.id) : null;
  const isSubscriber = profile?.is_subscriber ?? false;
  const events = await getVipEvents(isSubscriber);

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 pb-10">
      <Header eyebrow="Premium" title="VIP Events" />

      {!isSubscriber && (
        <div className="px-6">
          <Card className="texture-grain relative overflow-hidden bg-[var(--color-burgundy)] px-5 py-4 text-[var(--color-ivory)]">
            <div className="relative flex items-start gap-3">
              <Sparkles size={18} className="mt-0.5 shrink-0 text-[var(--color-gold-pale)]" />
              <div>
                <p className="text-sm font-medium">Go Premium for early access</p>
                <p className="mt-1 text-xs text-[var(--color-ivory)]/70">
                  Subscribers see VIP events — harvest dinners, member-only tastings — before anyone else
                  and can grab tickets first.
                </p>
                <Link href="/profile#premium" className="mt-2 inline-block text-xs font-medium text-[var(--color-gold-pale)] underline underline-offset-2">
                  Upgrade to Subscriber
                </Link>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="flex flex-col gap-3 px-6">
        {events.length === 0 ? (
          <Card className="px-4 py-6 text-center text-sm text-[var(--color-charcoal)]/55">
            No VIP events on the calendar right now — check back soon.
          </Card>
        ) : (
          events.map((event) => {
            const { month, day } = formatEventDateParts(event.event_date);
            return (
              <Card key={event.id} className="flex items-start gap-4 p-4">
                <div
                  className={
                    event.locked
                      ? "flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-black/5 text-[var(--color-charcoal)]/40"
                      : "flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-[var(--color-gold-pale)]/40 text-[var(--color-burgundy)]"
                  }
                >
                  <span className="text-[0.65rem] font-semibold tracking-wide">{month}</span>
                  <span className="font-serif-display text-xl leading-none">{day}</span>
                </div>

                {event.locked ? (
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-charcoal)]/50">
                      <Lock size={13} strokeWidth={2} />
                      Subscribers only for now
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-charcoal)]/45">
                      at {event.winery_name} — opens to everyone closer to the date.
                    </p>
                    <Link
                      href="/profile#premium"
                      className="mt-2 inline-block text-xs font-medium text-[var(--color-burgundy)] underline underline-offset-2"
                    >
                      Unlock with Premium
                    </Link>
                  </div>
                ) : (
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--color-charcoal)]">{event.title}</p>
                    <p className="text-xs text-[var(--color-charcoal)]/55">
                      {event.winery_name}
                      {event.event_time ? ` · ${event.event_time}` : ""}
                    </p>
                    {event.description && (
                      <p className="mt-1 text-xs text-[var(--color-charcoal)]/60">{event.description}</p>
                    )}
                    {event.ticket_url && (
                      <a
                        href={event.ticket_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[var(--color-burgundy)] underline underline-offset-2"
                      >
                        Tickets / RSVP
                        <ExternalLink size={11} strokeWidth={2} />
                      </a>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {!isSubscriber && (
        <div className="px-6">
          <LinkButton href="/profile#premium" variant="primary" size="lg" fullWidth>
            Go Premium
          </LinkButton>
        </div>
      )}
    </main>
  );
}
