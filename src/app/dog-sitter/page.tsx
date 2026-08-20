import type { Metadata } from "next";
import { getDogsPublic } from "@/lib/dogs";
import { DogCard } from "@/components/dogsitter/DogCard";

export const metadata: Metadata = {
  title: "Dog Care Guide",
  robots: { index: false, follow: false },
};

export default async function DogSitterPage() {
  const dogs = await getDogsPublic();

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-5 pt-10 pb-14">
      <div className="text-center">
        <h1 className="font-serif-display text-3xl text-[var(--color-charcoal)]">Dog Care Guide</h1>
        <p className="mt-1 text-sm text-[var(--color-charcoal)]/55">
          Everything you need for the pups — thanks so much for looking after them!
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {dogs.map((dog) => (
          <DogCard key={dog.id} dog={dog} />
        ))}
      </div>
    </main>
  );
}
