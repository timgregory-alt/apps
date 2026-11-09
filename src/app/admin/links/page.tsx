import { getTrackedLinksAdmin } from "@/lib/admin";
import { TrackedLinksManager } from "@/components/admin/TrackedLinksManager";

export default async function AdminLinksPage() {
  const links = await getTrackedLinksAdmin();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif-display text-2xl text-[var(--color-charcoal)]">Links</h1>
        <p className="mt-1 text-sm text-[var(--color-charcoal)]/60">
          Short, trackable redirect links for printed or shared collateral — QR codes, bio links,
          campaigns. Change the destination anytime without reprinting anything.
        </p>
      </div>
      <TrackedLinksManager links={links} />
    </div>
  );
}
