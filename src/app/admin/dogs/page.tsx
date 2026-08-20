import Link from "next/link";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { getAllDogsAdmin } from "@/lib/admin";

export default async function AdminDogsPage() {
  const dogs = await getAllDogsAdmin();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif-display text-2xl text-[var(--color-charcoal)]">Dogs</h1>
          <p className="mt-1 text-sm text-[var(--color-charcoal)]/55">
            Photo, food, medication, and vet info for each dog — shown on the public page shared with the sitter.
          </p>
        </div>
        <Link
          href="/dog-sitter"
          target="_blank"
          className="flex items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-charcoal)]"
        >
          <ExternalLink size={16} />
          View sitter page
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        {dogs.map((d) => (
          <Link
            key={d.id}
            href={`/admin/dogs/${d.id}`}
            className="flex items-center gap-3 rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3.5 hover:border-[var(--color-gold)]"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-ivory-deep)]">
              {d.photo ? (
                <Image src={d.photo} alt="" width={48} height={48} unoptimized className="h-full w-full object-cover" />
              ) : (
                <span className="text-[10px] text-[var(--color-charcoal)]/40">No photo</span>
              )}
            </div>
            <div>
              <p className="font-medium text-[var(--color-charcoal)]">{d.name}</p>
              <p className="text-xs text-[var(--color-charcoal)]/55">
                {[d.breed, d.age].filter(Boolean).join(" · ") || "No info yet"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
