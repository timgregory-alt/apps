import Link from "next/link";
import { Plus } from "lucide-react";
import { getAdminStats, getAllWineriesAdmin } from "@/lib/admin";
import { RemoveWineryButton } from "@/components/admin/RemoveWineryButton";

export default async function AdminWineriesPage() {
  const [wineries, stats] = await Promise.all([getAllWineriesAdmin(), getAdminStats()]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif-display text-2xl text-[var(--color-charcoal)]">Wineries</h1>
          <p className="mt-1 text-sm text-[var(--color-charcoal)]/55">
            Manage the winery roster. New wineries can be added without a code change.
          </p>
        </div>
        <Link
          href="/admin/wineries/new"
          className="flex items-center gap-1.5 rounded-full bg-[var(--color-burgundy)] px-4 py-2.5 text-sm font-medium text-white"
        >
          <Plus size={16} />
          Add Winery
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        {wineries.map((w) => (
          <Link
            key={w.id}
            href={`/admin/wineries/${w.id}`}
            className="flex items-center justify-between rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3.5 hover:border-[var(--color-gold)]"
          >
            <div>
              <p className="font-medium text-[var(--color-charcoal)]">{w.name}</p>
              <p className="text-xs text-[var(--color-charcoal)]/55">
                {w.city}, {w.state} · {stats.checkinsByWinery[w.id] ?? 0} check-ins
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span
                className={
                  w.active
                    ? "rounded-full bg-[var(--color-gold-pale)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-burgundy-deep)]"
                    : "rounded-full bg-black/5 px-2.5 py-0.5 text-xs font-medium text-[var(--color-charcoal)]/50"
                }
              >
                {w.active ? "Active" : "Inactive"}
              </span>
              <RemoveWineryButton wineryId={w.id} active={w.active} name={w.name} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
