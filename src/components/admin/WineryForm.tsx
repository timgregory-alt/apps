"use client";

import { useState, useTransition } from "react";
import { metersToFeet } from "@/lib/geo";
import type { Winery } from "@/lib/types";

const inputClass =
  "h-11 w-full rounded-lg border border-[var(--color-line)] bg-white px-3 text-sm outline-none focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold)]/25";
const labelClass = "flex flex-col gap-1 text-sm";
const labelTextClass = "text-xs font-medium uppercase tracking-wide text-[var(--color-charcoal)]/50";

export function WineryForm({
  winery,
  action,
}: {
  winery?: Winery;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          try {
            await action(formData);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
          }
        });
      }}
      className="flex flex-col gap-5"
    >
      <div className="grid grid-cols-2 gap-4">
        <label className={labelClass}>
          <span className={labelTextClass}>Name</span>
          <input name="name" required defaultValue={winery?.name} className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Slug</span>
          <input name="slug" required defaultValue={winery?.slug} className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>City</span>
          <input name="city" required defaultValue={winery?.city} className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>State</span>
          <input name="state" defaultValue={winery?.state ?? "Tennessee"} className={inputClass} />
        </label>
      </div>

      <label className={labelClass}>
        <span className={labelTextClass}>Address</span>
        <input name="address" required defaultValue={winery?.address} className={inputClass} />
      </label>

      <div className="grid grid-cols-3 gap-4">
        <label className={labelClass}>
          <span className={labelTextClass}>Latitude</span>
          <input
            name="latitude"
            type="number"
            step="any"
            required
            defaultValue={winery?.latitude}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Longitude</span>
          <input
            name="longitude"
            type="number"
            step="any"
            required
            defaultValue={winery?.longitude}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Check-in Radius (feet)</span>
          <input
            name="checkin_radius_feet"
            type="number"
            min={100}
            max={2000}
            defaultValue={winery ? metersToFeet(winery.checkin_radius_meters) : 750}
            className={inputClass}
          />
        </label>
      </div>

      <label className={labelClass}>
        <span className={labelTextClass}>Description</span>
        <textarea
          name="description"
          rows={3}
          defaultValue={winery?.description}
          className={`${inputClass} h-auto py-2`}
        />
      </label>

      <label className={labelClass}>
        <span className={labelTextClass}>Hero Image URL (optional — placeholder art used until set)</span>
        <input name="hero_image" defaultValue={winery?.hero_image ?? ""} className={inputClass} />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className={labelClass}>
          <span className={labelTextClass}>Website URL</span>
          <input name="website_url" defaultValue={winery?.website_url ?? ""} className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Hours</span>
          <input name="hours" defaultValue={winery?.hours ?? ""} className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Phone</span>
          <input name="phone" defaultValue={winery?.phone ?? ""} className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Instagram URL</span>
          <input name="instagram_url" defaultValue={winery?.instagram_url ?? ""} className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Facebook URL</span>
          <input name="facebook_url" defaultValue={winery?.facebook_url ?? ""} className={inputClass} />
        </label>
      </div>

      <div className="rounded-xl border border-[var(--color-gold)]/30 bg-[var(--color-gold-pale)]/20 p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[var(--color-charcoal)]/50">
          Wine Club
        </p>
        <div className="flex flex-col gap-4">
          <label className={labelClass}>
            <span className={labelTextClass}>Wine Club URL</span>
            <input name="wine_club_url" defaultValue={winery?.wine_club_url ?? ""} className={inputClass} />
          </label>
          <label className={labelClass}>
            <span className={labelTextClass}>Wine Club Title</span>
            <input
              name="wine_club_title"
              defaultValue={winery?.wine_club_title ?? ""}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            <span className={labelTextClass}>Wine Club Description</span>
            <input
              name="wine_club_description"
              defaultValue={winery?.wine_club_description ?? ""}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            <span className={labelTextClass}>Benefits (one per line)</span>
            <textarea
              name="wine_club_benefits"
              rows={4}
              defaultValue={winery?.wine_club_benefits?.join("\n") ?? ""}
              className={`${inputClass} h-auto py-2`}
            />
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--color-line)] bg-white/40 p-4">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--color-charcoal)]/50">
          Automatic Wine List Sync
        </p>
        <p className="mb-3 text-xs text-[var(--color-charcoal)]/55">
          A scheduled check periodically reads this page and adds any new wines it finds to this
          winery&rsquo;s tasting list automatically. Leave blank to use the Website URL above, or
          point at a more specific wine list / menu page.
        </p>
        <label className={labelClass}>
          <span className={labelTextClass}>Wine List / Menu URL (optional)</span>
          <input name="wine_menu_url" defaultValue={winery?.wine_menu_url ?? ""} className={inputClass} />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={winery?.active ?? true} className="h-4 w-4" />
        Active (visible to guests)
      </label>

      {error && <p className="text-sm text-[var(--color-burgundy)]">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="h-12 rounded-full bg-[var(--color-burgundy)] font-medium text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : winery ? "Save Changes" : "Create Winery"}
      </button>
    </form>
  );
}
