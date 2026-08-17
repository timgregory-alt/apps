import { getAdminStats, getAllWineriesAdmin, getWineLikeStats, LIKED_RATING_THRESHOLD } from "@/lib/admin";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-white px-5 py-4">
      <p className="font-serif-display text-3xl text-[var(--color-burgundy)]">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-[var(--color-charcoal)]/50">{label}</p>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const [stats, wineries, wineLikeStats] = await Promise.all([
    getAdminStats(),
    getAllWineriesAdmin(),
    getWineLikeStats(),
  ]);

  const mostPopular = Object.entries(stats.checkinsByWinery).sort((a, b) => b[1] - a[1])[0];
  const mostPopularWinery = wineries.find((w) => w.id === mostPopular?.[0]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-serif-display text-2xl text-[var(--color-charcoal)]">Overview</h1>
        <p className="mt-1 text-sm text-[var(--color-charcoal)]/55">
          Traffic, engagement, and conversion across the Founding Trail.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="New Accounts" value={stats.totalAccounts} />
        <StatCard label="Total Check-ins" value={stats.totalCheckins} />
        <StatCard label="Passport Completions" value={stats.totalCompletions} />
        <StatCard label="Wine Club Clicks" value={stats.totalWineClubClicks} />
        <StatCard label="Share Events" value={stats.totalShareEvents} />
        <StatCard label="Multi-Winery Visitors" value={stats.multiWineryVisitors} />
        <StatCard
          label="Most Popular Winery"
          value={mostPopularWinery?.name ?? "—"}
        />
        <StatCard
          label="Completion Rate"
          value={
            stats.totalAccounts > 0
              ? `${Math.round((stats.totalCompletions / stats.totalAccounts) * 100)}%`
              : "—"
          }
        />
      </div>

      <div>
        <h2 className="font-serif-display text-xl text-[var(--color-charcoal)]">By Winery</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-[var(--color-line)] bg-white">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="border-b border-[var(--color-line)] text-xs uppercase tracking-wide text-[var(--color-charcoal)]/50">
              <tr>
                <th className="px-4 py-3 font-medium">Winery</th>
                <th className="px-4 py-3 font-medium">Check-ins</th>
                <th className="px-4 py-3 font-medium">Wine Club Clicks</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {wineries.map((w) => (
                <tr key={w.id} className="border-b border-[var(--color-line)] last:border-0">
                  <td className="px-4 py-3">{w.name}</td>
                  <td className="px-4 py-3">{stats.checkinsByWinery[w.id] ?? 0}</td>
                  <td className="px-4 py-3">{stats.wineClubClicksByWinery[w.id] ?? 0}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        w.active
                          ? "rounded-full bg-[var(--color-gold-pale)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-burgundy-deep)]"
                          : "rounded-full bg-black/5 px-2.5 py-0.5 text-xs font-medium text-[var(--color-charcoal)]/50"
                      }
                    >
                      {w.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="font-serif-display text-xl text-[var(--color-charcoal)]">Most Liked</h2>
        <p className="mt-1 text-sm text-[var(--color-charcoal)]/55">
          A {LIKED_RATING_THRESHOLD}-5 star rating counts as &ldquo;liked.&rdquo;
        </p>

        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div className="overflow-x-auto rounded-2xl border border-[var(--color-line)] bg-white">
            <table className="w-full min-w-[320px] text-left text-sm">
              <thead className="border-b border-[var(--color-line)] text-xs uppercase tracking-wide text-[var(--color-charcoal)]/50">
                <tr>
                  <th className="px-4 py-3 font-medium">Winery</th>
                  <th className="px-4 py-3 font-medium">Wines Liked</th>
                </tr>
              </thead>
              <tbody>
                {wineLikeStats.byWinery.map((w) => (
                  <tr key={w.wineryId} className="border-b border-[var(--color-line)] last:border-0">
                    <td className="px-4 py-3">{w.wineryName}</td>
                    <td className="px-4 py-3">{w.likedCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[var(--color-line)] bg-white">
            <table className="w-full min-w-[320px] text-left text-sm">
              <thead className="border-b border-[var(--color-line)] text-xs uppercase tracking-wide text-[var(--color-charcoal)]/50">
                <tr>
                  <th className="px-4 py-3 font-medium">Wine</th>
                  <th className="px-4 py-3 font-medium">Winery</th>
                  <th className="px-4 py-3 font-medium">Liked</th>
                </tr>
              </thead>
              <tbody>
                {wineLikeStats.topWines.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-[var(--color-charcoal)]/45">
                      No liked wines yet.
                    </td>
                  </tr>
                ) : (
                  wineLikeStats.topWines.map((w) => (
                    <tr key={w.wineId} className="border-b border-[var(--color-line)] last:border-0">
                      <td className="px-4 py-3">{w.wineName}</td>
                      <td className="px-4 py-3 text-[var(--color-charcoal)]/60">{w.wineryName}</td>
                      <td className="px-4 py-3">{w.likedCount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {stats.totalAccounts === 0 && (
        <p className="text-sm text-[var(--color-charcoal)]/45">
          No analytics yet — figures populate once Supabase is connected and guests start
          checking in.
        </p>
      )}
    </div>
  );
}
