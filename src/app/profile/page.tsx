import { Suspense } from "react";
import {
  getCurrentUser,
  getProfile,
  getTrailCompletions,
  getWineriesWithStatus,
  getUserAppRating,
  getQualifyingReferralCount,
  getActiveRewardTiers,
} from "@/lib/data";
import { visitedCount } from "@/lib/trail";
import { formatCheckinDate } from "@/lib/utils";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { DeleteAccountSection } from "@/components/profile/DeleteAccountSection";
import { AccountInfoForm } from "@/components/profile/AccountInfoForm";
import { ChangePasswordForm } from "@/components/profile/ChangePasswordForm";
import { AppRatingCard } from "@/components/profile/AppRatingCard";
import { BugReportCard } from "@/components/profile/BugReportCard";
import { ReferralCard } from "@/components/profile/ReferralCard";
import { SubscriptionUpsellCard } from "@/components/profile/SubscriptionUpsellCard";
import { AuthModal } from "@/components/auth/AuthModal";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    const wineries = await getWineriesWithStatus(null);
    const stats = [
      { label: "Wineries Visited", value: "—" },
      { label: "Total Check-ins", value: "—" },
      { label: "Trails Completed", value: "—" },
      { label: "Trail Started", value: "—" },
    ];

    return (
      <>
        <main className="mx-auto flex max-w-md flex-col gap-8 pb-10">
          <Header eyebrow="My Trails" title="Your Trail" />

          <div className="px-6">
            <div className="flex items-baseline justify-between">
              <p className="font-serif-display text-lg text-[var(--color-charcoal)]">
                0 / {wineries.length} Complete
              </p>
            </div>
            <ProgressBar value={0} max={wineries.length} className="mt-3" />
          </div>

          <div className="grid grid-cols-2 gap-3 px-6">
            {stats.map((s) => (
              <Card key={s.label} className="px-4 py-4">
                <p className="font-serif-display text-2xl text-[var(--color-burgundy)]">{s.value}</p>
                <p className="mt-1 text-xs text-[var(--color-charcoal)]/55">{s.label}</p>
              </Card>
            ))}
          </div>
        </main>
        <Suspense>
          <AuthModal />
        </Suspense>
      </>
    );
  }

  const [profile, completions, wineries, appRating, referralCount, rewardTiers] = await Promise.all([
    getProfile(user.id),
    getTrailCompletions(user.id),
    getWineriesWithStatus(user.id),
    getUserAppRating(user.id),
    getQualifyingReferralCount(),
    getActiveRewardTiers(),
  ]);

  const visited = visitedCount(wineries);
  const displayName = profile?.name || user.email?.split("@")[0] || "Your";
  const possessive = displayName.toLowerCase().endsWith("s") ? `${displayName}'` : `${displayName}'s`;

  const startDate = profile?.trail_start_date ?? user.created_at;
  const completionDate = completions[0]?.completed_at as string | undefined;

  const stats = [
    { label: "Wineries Visited", value: `${visited}` },
    { label: "Total Check-ins", value: `${visited}` },
    { label: "Trails Completed", value: `${completions.length}` },
    { label: "Trail Started", value: startDate ? formatCheckinDate(startDate) : "—" },
  ];

  return (
    <main className="mx-auto flex max-w-md flex-col gap-8 pb-10">
      <Header eyebrow="My Trails" title={`${possessive} Trail`} />

      <div className="px-6">
        <SubscriptionUpsellCard isSubscriber={profile?.is_subscriber ?? false} tiers={rewardTiers} />
      </div>

      <div className="px-6">
        <div className="flex items-baseline justify-between">
          <p className="font-serif-display text-lg text-[var(--color-charcoal)]">
            {visited} / {wineries.length} Complete
          </p>
        </div>
        <ProgressBar value={visited} max={wineries.length} className="mt-3" />
      </div>

      <div className="flex flex-col gap-2 px-6">
        {wineries.map((w) => (
          <div key={w.id} className="flex items-center gap-3 text-sm">
            <span
              className={
                w.status !== "not_visited"
                  ? "text-[var(--color-gold)]"
                  : "text-[var(--color-charcoal)]/30"
              }
            >
              {w.status !== "not_visited" ? "✓" : "○"}
            </span>
            <span
              className={
                w.status !== "not_visited"
                  ? "text-[var(--color-charcoal)]"
                  : "text-[var(--color-charcoal)]/45"
              }
            >
              {w.name}
            </span>
          </div>
        ))}
      </div>

      {completionDate && (
        <div className="px-6">
          <Card className="px-4 py-3 text-center text-sm text-[var(--color-charcoal)]/70">
            Trail completed {formatCheckinDate(completionDate)}
          </Card>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 px-6">
        {stats.map((s) => (
          <Card key={s.label} className="px-4 py-4">
            <p className="font-serif-display text-2xl text-[var(--color-burgundy)]">{s.value}</p>
            <p className="mt-1 text-xs text-[var(--color-charcoal)]/55">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="px-6">
        <AppRatingCard
          initialRating={appRating?.rating ?? 0}
          initialFeedback={appRating?.feedback ?? ""}
        />
      </div>

      <div className="px-6">
        <ReferralCard userId={user.id} referralCount={referralCount} />
      </div>

      <div className="px-6">
        <AccountInfoForm
          initialName={profile?.name ?? ""}
          initialEmail={profile?.email ?? user.email ?? ""}
          initialZipCode={profile?.zip_code ?? ""}
          initialBirthDate={profile?.birth_date ?? ""}
          birthDateLocked={profile?.birth_date_locked ?? false}
        />
      </div>

      <div className="px-6">
        <ChangePasswordForm />
      </div>

      <div className="px-6">
        <BugReportCard />
      </div>

      <div className="px-6">
        <SignOutButton />
      </div>

      <div className="px-6">
        <DeleteAccountSection />
      </div>
    </main>
  );
}
