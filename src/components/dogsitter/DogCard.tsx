import Image from "next/image";
import { PawPrint, Phone, Pill, Stethoscope, Utensils } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { Dog } from "@/lib/types";

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <Icon size={18} className="mt-0.5 shrink-0 text-[var(--color-gold)]" />
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-charcoal)]/50">{label}</p>
        <p className="whitespace-pre-line text-sm text-[var(--color-charcoal)]">{value}</p>
      </div>
    </div>
  );
}

export function DogCard({ dog }: { dog: Dog }) {
  const basics = [dog.breed, dog.age, dog.weight].filter(Boolean).join(" · ");

  return (
    <Card className="overflow-hidden">
      <div className="flex h-56 w-full items-center justify-center bg-[var(--color-ivory-deep)]">
        {dog.photo ? (
          <Image
            src={dog.photo}
            alt={dog.name}
            width={600}
            height={448}
            unoptimized
            className="h-full w-full object-cover"
          />
        ) : (
          <PawPrint size={40} className="text-[var(--color-charcoal)]/25" />
        )}
      </div>

      <div className="flex flex-col gap-4 p-5">
        <div>
          <h2 className="font-serif-display text-xl text-[var(--color-charcoal)]">{dog.name}</h2>
          {basics && <p className="text-sm text-[var(--color-charcoal)]/55">{basics}</p>}
        </div>

        {dog.food && <InfoRow icon={Utensils} label="Food" value={dog.food} />}
        {dog.medication && <InfoRow icon={Pill} label="Medication" value={dog.medication} />}
        {dog.allergies && <InfoRow icon={PawPrint} label="Allergies" value={dog.allergies} />}
        {dog.notes && <InfoRow icon={PawPrint} label="Notes" value={dog.notes} />}

        {(dog.vet_name || dog.vet_phone) && (
          <InfoRow
            icon={Stethoscope}
            label="Vet"
            value={[dog.vet_name, dog.vet_phone].filter(Boolean).join(" · ")}
          />
        )}
        {(dog.emergency_contact_name || dog.emergency_contact_phone) && (
          <InfoRow
            icon={Phone}
            label="Emergency contact"
            value={[dog.emergency_contact_name, dog.emergency_contact_phone].filter(Boolean).join(" · ")}
          />
        )}
      </div>
    </Card>
  );
}
