import { getWineryStaffContext } from "@/lib/portal";
import { createClient } from "@/lib/supabase/server";
import { WineryEventsManager } from "@/components/portal/WineryEventsManager";
import type { WineryEvent } from "@/lib/types";

export default async function PortalEventsPage() {
  const ctx = await getWineryStaffContext();
  if (!ctx) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("winery_events")
    .select("*")
    .eq("winery_id", ctx.winery.id)
    .order("event_date", { ascending: true });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif-display text-2xl text-[var(--color-charcoal)]">Events</h1>
        <p className="mt-1 text-sm text-[var(--color-charcoal)]/55">
          Manage upcoming events at {ctx.winery.name}. Mark one VIP to feature it on the trail&rsquo;s VIP page —
          subscribers see it first, everyone else once its early-access window passes.
        </p>
      </div>

      <WineryEventsManager wineryId={ctx.winery.id} events={(data as WineryEvent[]) ?? []} />
    </div>
  );
}
