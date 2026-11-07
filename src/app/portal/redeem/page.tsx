import { getWineryStaffContext } from "@/lib/portal";
import { RedeemScanner } from "@/components/portal/RedeemScanner";

export default async function PortalRedeemPage() {
  const ctx = await getWineryStaffContext();
  if (!ctx) return null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif-display text-2xl text-[var(--color-charcoal)]">Redeem a Reward</h1>
        <p className="mt-1 text-sm text-[var(--color-charcoal)]/55">
          Scan a guest&rsquo;s QR code or type their code in. Each code can only be honored once — if it&rsquo;s
          already been used, you&rsquo;ll see exactly when.
        </p>
      </div>

      <RedeemScanner />
    </div>
  );
}
