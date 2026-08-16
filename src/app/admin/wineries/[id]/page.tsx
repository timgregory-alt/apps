import { notFound } from "next/navigation";
import { getWineryByIdAdmin } from "@/lib/admin";
import { getWineryHours } from "@/lib/data";
import { WineryForm } from "@/components/admin/WineryForm";
import { SeasonalHoursEditor } from "@/components/admin/SeasonalHoursEditor";
import { WineSyncPanel } from "@/components/admin/WineSyncPanel";
import { QrCode } from "@/components/ui/QrCode";
import { updateWineryAction } from "@/app/admin/wineries/actions";

export default async function EditWineryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const winery = await getWineryByIdAdmin(id);
  if (!winery) notFound();

  const hoursSeasons = await getWineryHours(winery.id);
  const boundAction = updateWineryAction.bind(null, winery.id);
  const qrUrl = `https://tennesseewinepassport.com/winery/${winery.slug}`;

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      <div className="max-w-xl flex-1">
        <h1 className="font-serif-display text-2xl text-[var(--color-charcoal)]">{winery.name}</h1>
        <p className="mt-1 mb-6 text-sm text-[var(--color-charcoal)]/55">
          Editing this winery updates the live app immediately.
        </p>
        <WineryForm winery={winery} action={boundAction} />

        <div className="mt-6">
          <SeasonalHoursEditor wineryId={winery.id} initialSeasons={hoursSeasons} />
        </div>

        <div className="mt-6">
          <WineSyncPanel
            wineryId={winery.id}
            wineMenuUrl={winery.wine_menu_url}
            websiteUrl={winery.website_url}
          />
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
          Scanning opens this winery&rsquo;s profile. It does not count as a check-in — GPS
          verification is still required.
        </p>
      </div>
    </div>
  );
}
