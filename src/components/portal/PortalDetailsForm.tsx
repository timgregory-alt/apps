"use client";

import { useState, useTransition } from "react";
import { updateWineryDetailsAsStaffAction } from "@/app/portal/details/actions";
import type { Winery } from "@/lib/types";

const inputClass =
  "h-11 w-full rounded-lg border border-[var(--color-line)] bg-white px-3 text-sm outline-none focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold)]/25";
const labelClass = "flex flex-col gap-1 text-sm";
const labelTextClass = "text-xs font-medium uppercase tracking-wide text-[var(--color-charcoal)]/50";

export function PortalDetailsForm({ winery }: { winery: Winery }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  return (
    <form
      action={(formData) => {
        setError(null);
        setSaved(false);
        startTransition(async () => {
          const result = await updateWineryDetailsAsStaffAction(winery.id, formData);
          if (result?.error) setError(result.error);
          else setSaved(true);
        });
      }}
      className="flex flex-col gap-5 rounded-2xl border border-[var(--color-line)] bg-white p-5"
    >
      <label className={labelClass}>
        <span className={labelTextClass}>Description</span>
        <textarea
          name="description"
          defaultValue={winery.description}
          rows={3}
          className="w-full rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold)]/25"
        />
      </label>

      <label className={labelClass}>
        <span className={labelTextClass}>Hours (plain text fallback)</span>
        <input name="hours" defaultValue={winery.hours ?? ""} className={inputClass} />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className={labelClass}>
          <span className={labelTextClass}>Phone</span>
          <input name="phone" defaultValue={winery.phone ?? ""} className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Website</span>
          <input name="website_url" defaultValue={winery.website_url ?? ""} className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Instagram</span>
          <input name="instagram_url" defaultValue={winery.instagram_url ?? ""} className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Facebook</span>
          <input name="facebook_url" defaultValue={winery.facebook_url ?? ""} className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Yelp</span>
          <input name="yelp_url" defaultValue={winery.yelp_url ?? ""} className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Wine Menu Page</span>
          <input name="wine_menu_url" defaultValue={winery.wine_menu_url ?? ""} className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Events Page</span>
          <input name="events_page_url" defaultValue={winery.events_page_url ?? ""} className={inputClass} />
        </label>
      </div>

      <div className="border-t border-[var(--color-line)] pt-4">
        <p className={labelTextClass}>Wine Club</p>
        <div className="mt-3 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <label className={labelClass}>
              <span className={labelTextClass}>Club Name</span>
              <input name="wine_club_title" defaultValue={winery.wine_club_title ?? ""} className={inputClass} />
            </label>
            <label className={labelClass}>
              <span className={labelTextClass}>Club Link</span>
              <input name="wine_club_url" defaultValue={winery.wine_club_url ?? ""} className={inputClass} />
            </label>
          </div>
          <label className={labelClass}>
            <span className={labelTextClass}>Club Description</span>
            <input
              name="wine_club_description"
              defaultValue={winery.wine_club_description ?? ""}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            <span className={labelTextClass}>Club Benefits (one per line)</span>
            <textarea
              name="wine_club_benefits"
              defaultValue={(winery.wine_club_benefits ?? []).join("\n")}
              rows={4}
              className="w-full rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold)]/25"
            />
          </label>
        </div>
      </div>

      {error && <p className="text-sm text-[var(--color-burgundy)]">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-full bg-[var(--color-burgundy)] text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : saved ? "Saved" : "Save Details"}
      </button>
    </form>
  );
}
