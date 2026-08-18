import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  getCurrentUser,
  getProfile,
  getWineriesWithStatus,
  getWineryBySlug,
  getWinesWithTastings,
  getCustomWineTastings,
  getWineryHours,
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
import { Button, LinkButton } from "@/components/ui/Button";
import { SectionEyebrow } from "@/components/ui/Card";
import { Lock, Star } from "lucide-react";

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
  if (!user) redirect(`/login?redirectTo=${encodeURIComponent(`/winery/${slug}`)}`);

  const profile = await getProfile(user.id);
  const isSubscriber = profile?.is_subscriber ?? false;

  const [wineries, allWines, customTastings, hoursSeasons] = await Promise.all([
    getWineriesWithStatus(user.id),
    getWinesWithTastings(user.id),
    getCustomWineTastings(user.id),
    getWineryHours(winery.id),
  ]);
  const wineryWithStatus = wineries.find((w) => w.id === winery.id) ?? {
    ...winery,
    status: "not_visited" as const,
    checkin: null,
  };
  const allWineryWines = allWines.filter((w) => w.winery_id === winery.id);
  const wineryWines = allWineryWines.filter((w) => w.style !== "mead");
  const meadWines = allWineryWines.filter((w) => w.style === "mead");
  const wineryCustomTastings = customTastings.filter((t) => t.winery_id === winery.id);

  return (
    <main className="mx-auto flex max-w-md flex-col pb-10">
      <WineryHero winery={wineryWithStatus} />

      <div className="flex flex-col gap-7 px-6 pt-6">
        <WineryDescription winery={winery} />

        <WinerySocialRow winery={winery} />

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

        {winery.yelp_url && (
          isSubscriber ? (
            <LinkButton href={winery.yelp_url} target="_blank" rel="noopener noreferrer" variant="outline" fullWidth>
              <Star size={16} strokeWidth={2} />
              Review on Yelp
            </LinkButton>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <Button variant="outline" fullWidth disabled>
                <Lock size={16} strokeWidth={2} />
                Review on Yelp
              </Button>
              <p className="text-xs text-[var(--color-charcoal)]/45">Subscribers only</p>
            </div>
          )
        )}

        <WineryDetailsList winery={winery} hoursSeasons={hoursSeasons} />

        <CheckInFlow winery={wineryWithStatus} allWineries={wineries} isLoggedIn />

        <div>
          <SectionEyebrow>Wine Tasting</SectionEyebrow>
          <p className="font-serif-display mt-1 mb-4 text-xl text-[var(--color-charcoal)]">
            Wines Poured Here
          </p>
          <WineTastingList
            initialWines={wineryWines}
            initialCustomTastings={wineryCustomTastings}
            wineryId={winery.id}
            isLoggedIn
            redirectTo={`/winery/${winery.slug}`}
            showProgress={false}
          />
        </div>

        {meadWines.length > 0 && (
          <div>
            <SectionEyebrow>A Rare Find</SectionEyebrow>
            <p className="font-serif-display mt-1 mb-1 text-xl text-[var(--color-charcoal)]">
              Mead
            </p>
            <p className="mb-4 text-sm text-[var(--color-charcoal)]/55">
              Honey wine — not something you&rsquo;ll find at most Tennessee wineries.
            </p>
            <WineTastingList
              initialWines={meadWines}
              wineryId={winery.id}
              isLoggedIn
              redirectTo={`/winery/${winery.slug}`}
              showProgress={false}
              allowCustom={false}
            />
          </div>
        )}

        <WineClubSection winery={winery} />
      </div>
    </main>
  );
}
