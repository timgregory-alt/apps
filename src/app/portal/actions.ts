"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { isCurrentUserStaffFor, ACTIVE_PORTAL_WINERY_COOKIE } from "@/lib/portal";

export type PortalSwitchResult = { error: string } | void;

/** Switches which winery the portal shows for staff with access to more
 * than one (e.g. Big Creek's two locations under one login). */
export async function setActivePortalWineryAction(wineryId: string): Promise<PortalSwitchResult> {
  if (!(await isCurrentUserStaffFor(wineryId))) return { error: "Not authorized" };

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_PORTAL_WINERY_COOKIE, wineryId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/portal", "layout");
}
