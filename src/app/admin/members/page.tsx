import { getAllMembersAdmin, cityFromZip } from "@/lib/admin";
import { SubscriberToggle } from "@/components/admin/SubscriberToggle";
import { formatCheckinDate } from "@/lib/utils";

export default async function AdminMembersPage() {
  const members = await getAllMembersAdmin();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif-display text-2xl text-[var(--color-charcoal)]">Members</h1>
        <p className="mt-1 text-sm text-[var(--color-charcoal)]/55">
          No billing is wired up yet — Subscriber is a manual flag for testing premium features
          like early access to events.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {members.length === 0 && (
          <p className="text-sm text-[var(--color-charcoal)]/50">No members yet.</p>
        )}
        {members.map((m) => {
          const city = cityFromZip(m.zip_code);
          return (
            <div
              key={m.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3.5"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-[var(--color-charcoal)]">
                  {m.name || "(no name)"}
                </p>
                <p className="truncate text-xs text-[var(--color-charcoal)]/55">
                  {m.email} · Joined {formatCheckinDate(m.created_at)}
                  {city ? ` · ${city}` : ""}
                </p>
              </div>
              <SubscriberToggle userId={m.id} initialIsSubscriber={m.is_subscriber} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
