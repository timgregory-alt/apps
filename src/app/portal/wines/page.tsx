import { getWineryStaffContext } from "@/lib/portal";
import { getWineryWinesAdmin } from "@/lib/admin";
import { WineSoldOutList } from "@/components/admin/WineSoldOutList";
import { WineSyncPanel } from "@/components/admin/WineSyncPanel";

export default async function PortalWinesPage() {
  const ctx = await getWineryStaffContext();
  if (!ctx) return null;

  const wines = await getWineryWinesAdmin(ctx.winery.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif-display text-2xl text-[var(--color-charcoal)]">Wines</h1>
        <p className="mt-1 text-sm text-[var(--color-charcoal)]/55">
          Mark a wine sold out to gray it out and label it on the app for guests. Adding or
          removing wines from the list itself is done automatically by checking your website —
          use the sync button below to check right now.
        </p>
      </div>

      {wines.length === 0 ? (
        <p className="text-sm text-[var(--color-charcoal)]/50">
          No wines on file yet — run a sync below once your website or wine menu link is set (ask
          the trail admin if you need that added).
        </p>
      ) : (
        <WineSoldOutList wineryId={ctx.winery.id} wines={wines} />
      )}

      <WineSyncPanel
        wineryId={ctx.winery.id}
        wineMenuUrl={ctx.winery.wine_menu_url}
        websiteUrl={ctx.winery.website_url}
      />
    </div>
  );
}
