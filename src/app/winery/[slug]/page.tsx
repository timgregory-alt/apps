import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getCurrentUser,
  getWineriesWithStatus,
  getWineryBySlug,
  getWinesWithTastings,
} from "@/lib/data";
import { WineryHero } from "@/components/winery/WineryHero";
import {
  WineryDescription,
  WineryDetailsList,
  WinerySocialRow,
} from "@/components/winery/WineryInfo";
import { DirectionsButton } from "@/components/winery/DirectionsButton";
import { WineClubSection } from "@/components/wineclub/WineClubSection";
import { CheckInFlow } from "@/components/checkin/CheckInFlow";
import { WineTastingList } from "@/components/tasting/WineTastingList";
import { LinkButton } from "@/components/ui/Button";
import { SectionEyebrow } from "@/components/ui/Card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const winery = await getWineryBySlug(slug);
  if (!winery) return { title: "Winery Not Found — Tennessee Wine Passport" };
  return {
    title: `${winery.name} — Tennessee Wine Passport`,
    description: winery.description,
  };
}

export default async function WineryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const winery = await getWineryBySlug(slug);
  if (!winery) notFound();

  const user = await getCurrentUser();
  const [wineries, allWines] = await Promise.all([
    getWineriesWithStatus(user?.id ?? null),
    getWinesWithTastings(user?.id ?? null),
  ]);
  const wineryWithStatus = wineries.find((w) => w.id === winery.id) ?? {
    ...winery,
    status: "not_visited" as const,
    checkin: null,
  };
  const wineryWines = allWines.filter((w) => w.winery_id === winery.id);

  return (
    <main className="mx-auto flex max-w-md flex-col pb-10">
      <WineryHero winery={wineryWithStatus} />

      <div className="flex flex-col gap-7 px-6 pt-6">
        <WineryDescription winery={winery} />

        <div className="grid grid-cols-2 gap-2.5">
          <DirectionsButton
            lat={winery.latitude}
            lon={winery.longitude}
            label={winery.name}
            variant="outline"
            fullWidth
          />
          {winery.website_url ? (
            <LinkButton href={winery.website_url} target="_blank" rel="noopener noreferrer" variant="outline" fullWidth>
              Website
            </LinkButton>
          ) : (
            <span />
          )}
        </div>

        <CheckInFlow winery={wineryWithStatus} allWineries={wineries} isLoggedIn={!!user} />

        {wineryWines.length > 0 && (
          <div>
            <SectionEyebrow>Wine Tasting</SectionEyebrow>
            <p className="font-serif-display mt-1 mb-4 text-xl text-[var(--color-charcoal)]">
              Wines Poured Here
            </p>
            <WineTastingList
              initialWines={wineryWines}
              isLoggedIn={!!user}
              redirectTo={`/winery/${winery.slug}`}
              showProgress={false}
            />
          </div>
        )}

        <WineryDetailsList winery={winery} />

        <WinerySocialRow winery={winery} />

        <WineClubSection winery={winery} />
      </div>
    </main>
  );
}
