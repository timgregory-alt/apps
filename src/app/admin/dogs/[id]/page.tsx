import { notFound } from "next/navigation";
import { getDogByIdAdmin } from "@/lib/admin";
import { DogForm } from "@/components/admin/DogForm";
import { updateDogAction } from "@/app/admin/dogs/actions";

export default async function EditDogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dog = await getDogByIdAdmin(id);
  if (!dog) notFound();

  return (
    <div className="max-w-xl">
      <h1 className="font-serif-display text-2xl text-[var(--color-charcoal)]">{dog.name}</h1>
      <p className="mt-1 mb-6 text-sm text-[var(--color-charcoal)]/55">
        Changes appear on the sitter page immediately — no deploy required.
      </p>
      <DogForm dog={dog} action={updateDogAction} />
    </div>
  );
}
