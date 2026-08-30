import type {
  CustomWineTasting,
  WineRecommendation,
  WineryRecommendation,
  WineryWithStatus,
  WineStyle,
  WineWithTasting,
} from "@/lib/types";

export const STYLE_LABELS: Record<WineStyle, string> = {
  red: "bold reds",
  white: "crisp whites",
  rose: "dry rosés",
  sweet: "sweet, fruit-forward wines",
  sparkling: "sparkling wines",
  mead: "honey meads",
};

export const STYLE_BADGE: Record<WineStyle, string> = {
  red: "Red",
  white: "White",
  rose: "Rosé",
  sweet: "Sweet",
  sparkling: "Sparkling",
  mead: "Mead",
};

export interface TastingRecommendations {
  topStyles: WineStyle[];
  wines: WineRecommendation[];
  wineries: WineryRecommendation[];
}

const EMPTY: TastingRecommendations = { topStyles: [], wines: [], wineries: [] };

/** 4-5 stars counts as "liked" for recommendation purposes. */
const LIKED_RATING_THRESHOLD = 4;

/**
 * Content-based recommendations from a user's wine tasting flight: the
 * style(s) they've rated highly (4-5 stars) most often drive both a
 * shortlist of untasted wines to try next and the wineries most likely to
 * have them.
 */
export function computeRecommendations(
  wines: WineWithTasting[],
  wineries: WineryWithStatus[],
  customTastings: CustomWineTasting[] = []
): TastingRecommendations {
  const liked = wines.filter((w) => (w.tasting?.rating ?? 0) >= LIKED_RATING_THRESHOLD);
  const likedCustom = customTastings.filter((t) => t.liked);
  if (liked.length === 0 && likedCustom.length === 0) return EMPTY;

  const styleCounts = new Map<WineStyle, number>();
  for (const wine of liked) {
    styleCounts.set(wine.style, (styleCounts.get(wine.style) ?? 0) + 1);
  }
  for (const tasting of likedCustom) {
    styleCounts.set(tasting.style, (styleCounts.get(tasting.style) ?? 0) + 1);
  }
  const maxCount = Math.max(...styleCounts.values());
  const topStyles = [...styleCounts.entries()]
    .filter(([, count]) => count === maxCount)
    .map(([style]) => style);

  const recommendedWines: WineRecommendation[] = wines
    .filter((w) => !w.tasting && topStyles.includes(w.style))
    .map((w) => ({
      wine: w,
      winery: w.winery,
      reason: `Because you liked ${STYLE_LABELS[w.style]}`,
    }))
    .sort((a, b) => a.wine.sort_order - b.wine.sort_order);

  const wineryIdsWithTopStyle = new Set(
    wines.filter((w) => topStyles.includes(w.style)).map((w) => w.winery_id)
  );

  const recommendedWineries: WineryRecommendation[] = wineries
    .filter((winery) => wineryIdsWithTopStyle.has(winery.id))
    .sort((a, b) => {
      if (a.status === "not_visited" && b.status !== "not_visited") return -1;
      if (a.status !== "not_visited" && b.status === "not_visited") return 1;
      return a.sort_order - b.sort_order;
    })
    .map((winery) => {
      const matchingWines = wines.filter(
        (w) => w.winery_id === winery.id && topStyles.includes(w.style)
      );
      return {
        winery,
        matchingWines,
        reason:
          winery.status === "not_visited"
            ? `Pours ${STYLE_LABELS[matchingWines[0]?.style ?? topStyles[0]]} — not yet on My Trails`
            : `Pours ${STYLE_LABELS[matchingWines[0]?.style ?? topStyles[0]]}`,
      };
    });

  return { topStyles, wines: recommendedWines, wineries: recommendedWineries };
}

export interface WineryTastingProgress {
  tried: number;
  total: number;
  pct: number;
}

/** How much of a winery's curated tasting flight the current user has tried
 * (liked or not) — the denominator naturally grows as the winery adds new
 * wines, so the fill drops until the new arrivals are tried too. */
export function getWineryTastingProgress(
  wines: WineWithTasting[],
  wineryId: string
): WineryTastingProgress {
  const wineryWines = wines.filter((w) => w.winery_id === wineryId);
  const total = wineryWines.length;
  const tried = wineryWines.filter((w) => w.tasting != null).length;
  return { tried, total, pct: total > 0 ? tried / total : 0 };
}
