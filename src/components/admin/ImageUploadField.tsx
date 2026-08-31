"use client";

import { useRef, useState } from "react";
import { uploadWineryPhotoAction } from "@/app/admin/wineries/actions";

const inputClass =
  "h-11 w-full rounded-lg border border-[var(--color-line)] bg-white px-3 text-sm outline-none focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold)]/25";
const labelTextClass = "text-xs font-medium uppercase tracking-wide text-[var(--color-charcoal)]/50";

/** A photo URL field backed by a real file upload (to Supabase Storage)
 * instead of requiring someone to hand-paste a link — the URL input stays
 * editable too, for the rare case a stable direct link already exists. */
export function ImageUploadField({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const result = await uploadWineryPhotoAction(formData);
      if ("error" in result) setError(result.error);
      else setValue(result.url);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className={labelTextClass}>{label}</span>
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="h-32 w-full rounded-lg border border-[var(--color-line)] object-cover" />
      )}
      <div className="flex gap-2">
        <input
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="https://… or upload a photo"
          className={inputClass}
        />
        <label className="flex h-11 shrink-0 cursor-pointer items-center rounded-lg border border-[var(--color-line)] px-3 text-xs font-medium text-[var(--color-charcoal)]/70 hover:border-[var(--color-gold)]">
          {uploading ? "Uploading…" : "Upload"}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFile}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>
      {error && <p className="text-xs text-[var(--color-burgundy)]">{error}</p>}
    </div>
  );
}
