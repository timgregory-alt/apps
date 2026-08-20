"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Loader2, Upload } from "lucide-react";
import type { Dog } from "@/lib/types";

const inputClass =
  "h-11 w-full rounded-lg border border-[var(--color-line)] bg-white px-3 text-sm outline-none focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold)]/25";
const textareaClass =
  "min-h-24 w-full rounded-lg border border-[var(--color-line)] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold)]/25";
const labelClass = "flex flex-col gap-1 text-sm";
const labelTextClass = "text-xs font-medium uppercase tracking-wide text-[var(--color-charcoal)]/50";

/** Downscales and re-encodes an uploaded photo client-side so it stores as a
 * reasonably small base64 data URL directly on the dog row — no separate
 * storage bucket needed for just four photos. */
function resizeToDataUrl(file: File, maxDimension = 1000, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = document.createElement("img");
      img.onerror = () => reject(new Error("Could not read that image"));
      img.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function DogForm({
  dog,
  action,
}: {
  dog: Dog;
  action: (dogId: string, formData: FormData) => { error: string } | void | Promise<{ error: string } | void>;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [photo, setPhoto] = useState<string | null>(dog.photo);
  const [photoBusy, setPhotoBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoBusy(true);
    setError(null);
    try {
      setPhoto(await resizeToDataUrl(file));
    } catch {
      setError("Couldn't process that photo — try a different file.");
    } finally {
      setPhotoBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <form
      action={(formData) => {
        setError(null);
        setSaved(false);
        startTransition(async () => {
          const result = await action(dog.id, formData);
          if (result?.error) setError(result.error);
          else setSaved(true);
        });
      }}
      className="flex flex-col gap-5"
    >
      <input type="hidden" name="photo" value={photo ?? ""} />

      <div className="flex items-center gap-4">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-ivory-deep)]">
          {photo ? (
            <Image src={photo} alt="" width={96} height={96} unoptimized className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs text-[var(--color-charcoal)]/40">No photo</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={photoBusy}
            className="flex items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-charcoal)] disabled:opacity-60"
          >
            {photoBusy ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
            {photo ? "Replace photo" : "Upload photo"}
          </button>
          {photo && (
            <button
              type="button"
              onClick={() => setPhoto(null)}
              className="text-left text-xs text-[var(--color-charcoal)]/50 hover:underline"
            >
              Remove photo
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      <label className={labelClass}>
        <span className={labelTextClass}>Name</span>
        <input name="name" required defaultValue={dog.name} className={inputClass} />
      </label>

      <div className="grid grid-cols-3 gap-4">
        <label className={labelClass}>
          <span className={labelTextClass}>Breed</span>
          <input name="breed" defaultValue={dog.breed ?? ""} className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Age</span>
          <input name="age" defaultValue={dog.age ?? ""} placeholder="e.g. 3 years" className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Weight</span>
          <input name="weight" defaultValue={dog.weight ?? ""} placeholder="e.g. 45 lbs" className={inputClass} />
        </label>
      </div>

      <label className={labelClass}>
        <span className={labelTextClass}>Food</span>
        <textarea
          name="food"
          defaultValue={dog.food ?? ""}
          placeholder="What, how much, and when to feed"
          className={textareaClass}
        />
      </label>

      <label className={labelClass}>
        <span className={labelTextClass}>Medication</span>
        <textarea
          name="medication"
          defaultValue={dog.medication ?? ""}
          placeholder="Name, dose, and timing — leave blank if none"
          className={textareaClass}
        />
      </label>

      <label className={labelClass}>
        <span className={labelTextClass}>Allergies</span>
        <input name="allergies" defaultValue={dog.allergies ?? ""} className={inputClass} />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className={labelClass}>
          <span className={labelTextClass}>Vet name</span>
          <input name="vet_name" defaultValue={dog.vet_name ?? ""} className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Vet phone</span>
          <input name="vet_phone" type="tel" defaultValue={dog.vet_phone ?? ""} className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Emergency contact name</span>
          <input
            name="emergency_contact_name"
            defaultValue={dog.emergency_contact_name ?? ""}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Emergency contact phone</span>
          <input
            name="emergency_contact_phone"
            type="tel"
            defaultValue={dog.emergency_contact_phone ?? ""}
            className={inputClass}
          />
        </label>
      </div>

      <label className={labelClass}>
        <span className={labelTextClass}>Notes</span>
        <textarea
          name="notes"
          defaultValue={dog.notes ?? ""}
          placeholder="Temperament, routine, favorite toy — anything a sitter should know"
          className={textareaClass}
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && !error && <p className="text-sm text-[var(--color-burgundy)]">Saved.</p>}

      <button
        type="submit"
        disabled={pending || photoBusy}
        className="flex items-center justify-center gap-2 rounded-full bg-[var(--color-burgundy)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending && <Loader2 size={15} className="animate-spin" />}
        Save
      </button>
    </form>
  );
}
