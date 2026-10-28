import { redirect } from "next/navigation";

/** The portal's dashboard and details page were merged into one (the
 * analytics overview now lives at /portal/details) — this keeps every
 * existing /portal link (login redirects, password reset, the "Go to
 * Winery Portal" link on /profile, etc.) landing somewhere real instead
 * of breaking. */
export default function PortalRootPage() {
  redirect("/portal/details");
}
