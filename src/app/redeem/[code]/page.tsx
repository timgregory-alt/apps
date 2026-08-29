import { CheckCircle2, XCircle } from "lucide-react";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { formatCheckinDate } from "@/lib/utils";
import type { RewardTier } from "@/lib/types";

async function findRedemption(code: string) {
  if (!isSupabaseConfigured) return null;
  try {
    const supabase = await createAdminClient();
    const { data } = await supabase
      .from("reward_redemptions")
      .select("*, reward_tiers(*)")
      .eq("code", code)
      .maybeSingle();
    return data;
  } catch {
    return null;
  }
}

export default async function RedeemCodePage({ params }: { params: Promise<{ code: string }> }) {
  const { code: rawCode } = await params;
  const code = rawCode.toUpperCase();

  const data = await findRedemption(code);
  const tier = (data?.reward_tiers ?? null) as RewardTier | null;

  return (
    <main className="mx-auto flex max-w-md flex-col gap-8 pb-10">
      <Header eyebrow="Winery Redemption" title="Verify a Guest Reward" />

      <div className="px-6">
        {!data || !tier ? (
          <Card className="flex flex-col items-center gap-2 p-6 text-center">
            <XCircle size={28} className="text-[var(--color-burgundy)]" />
            <p className="text-sm font-medium text-[var(--color-charcoal)]">Code not found</p>
            <p className="text-xs text-[var(--color-charcoal)]/55">
              Double check the code with your guest, or ask them to reveal it again.
            </p>
          </Card>
        ) : (
          <Card className="flex flex-col items-center gap-3 p-6 text-center">
            <p className="font-serif-display text-2xl text-[var(--color-charcoal)]">{tier.label}</p>
            <p className="text-sm text-[var(--color-charcoal)]/60">
              {data.chosen_option ?? `${tier.discount_percent}% off`}
            </p>
            <p className="font-mono text-lg tracking-[0.3em] text-[var(--color-charcoal)]">{code}</p>

            <div className="flex items-center gap-2 rounded-full bg-[var(--color-gold-pale)]/50 px-4 py-2 text-sm font-medium text-[var(--color-burgundy-deep)]">
              <CheckCircle2 size={16} /> Redeemed {formatCheckinDate(data.redeemed_at)}
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}
