import { NextResponse } from "next/server";
import { after } from "next/server";
import { getCurrentUser, getTrackedLinkBySlug, logLinkClick } from "@/lib/data";

/** Short, stable redirect for anything printed or shared externally (a QR
 * code, a bio link, a campaign) whose destination might need to change, or
 * whose clicks need counting, without reprinting or re-sharing anything.
 * Logs the click (best-effort, via after()) then forwards to whatever
 * destination_url currently says for this slug. An unknown slug falls back
 * to the homepage rather than erroring on a visitor. */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { origin } = new URL(request.url);

  const link = await getTrackedLinkBySlug(slug);
  if (!link) return NextResponse.redirect(origin);

  const user = await getCurrentUser();
  after(() => logLinkClick(link.id, user?.id ?? null));

  return NextResponse.redirect(new URL(link.destination_url, origin));
}
