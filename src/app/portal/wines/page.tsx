import { getWineryStaffContext } from "@/lib/portal";
import { getWineryWinesAdmin } from "@/lib/admin";
import { WineryWinesManager } from "@/components/portal/WineryWinesManager";

export default async function PortalWinesPage() {
  const ctx = await getWineryStaffContext();
  if (!ctx) return null;

  const wines = await getWineryWinesAdmin(ctx.winery.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif-display text-2xl text-[var(--color-charcoal)]">Wines</h1>
        <p className="mt-1 text-sm text-[var(--color-charcoal)]/55">
          Add, edit, or remove wines from your list, and mark one sold out to gray it out and
          label it for guests.
        </p>
      </div>

      <WineryWinesManager wineryId={ctx.winery.id} wines={wines} />
    </div>
  );
}
