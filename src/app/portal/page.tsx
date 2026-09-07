import { getWineryStaffContext, getRepeatGuestStats } from "@/lib/portal";
import { createClient } from "@/lib/supabase/server";
import { QrCode } from "@/components/ui/QrCode";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-white px-5 py-4">
      <p className="font-serif-display text-3xl text-[var(--color-burgundy)]">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-[var(--color-charcoal)]/50">{label}</p>
    </div>
  );
}

export default async function PortalDashboardPage() {
  const ctx = await getWineryStaffContext();
  if (!ctx) return null;

  const supabase = await createClient();
  const todayISO = new Date().toISOString().slice(0, 10);
  const [{ count: upcomingCount }, { count: vipCount }, guestStats] = await Promise.all([
    supabase
      .from("winery_events")
      .select("*", { count: "exact", head: true })
      .eq("winery_id", ctx.winery.id)
      .gte("event_date", todayISO),
    supabase
      .from("winery_events")
      .select("*", { count: "exact", head: true })
      .eq("winery_id", ctx.winery.id)
      .eq("vip_only", true)
      .gte("event_date", todayISO),
    getRepeatGuestStats(ctx.winery.id),
  ]);

  const qrUrl = `https://tennesseewinetrails.com/winery/${ctx.winery.slug}`;

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      <div className="flex flex-1 flex-col gap-8">
        <div>
          <h1 className="font-serif-display text-2xl text-[var(--color-charcoal)]">{ctx.winery.name}</h1>
          <p className="mt-1 text-sm text-[var(--color-charcoal)]/55">
            Manage your events, wines, hours, links, and see how guests are returning.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Upcoming Events" value={upcomingCount ?? 0} />
          <StatCard label="Upcoming VIP Events" value={vipCount ?? 0} />
          <StatCard label="Total Guests" value={guestStats.totalGuests} />
          <StatCard label="Repeat Guests" value={guestStats.repeatGuests} />
        </div>
      </div>

      <div className="w-full max-w-xs shrink-0 rounded-2xl border border-[var(--color-line)] bg-white p-5 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-charcoal)]/50">
          Tasting Room QR Code
        </p>
        <div className="mt-3 flex justify-center">
          <QrCode value={qrUrl} size={180} />
        </div>
        <p className="mt-3 break-all text-xs text-[var(--color-charcoal)]/45">{qrUrl}</p>
        <p className="mt-2 text-xs text-[var(--color-charcoal)]/45">
          Scanning opens your winery&rsquo;s profile. It doesn&rsquo;t count as a check-in — GPS
          verification is still required.
        </p>
      </div>
    </div>
  );
}
