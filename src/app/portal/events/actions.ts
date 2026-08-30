"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isCurrentUserStaffFor } from "@/lib/portal";

export type PortalActionResult = { error: string } | void;

export interface EventInput {
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  ticket_url: string;
  vip_only: boolean;
}

function cleanInput(input: EventInput) {
  return {
    title: input.title.trim(),
    description: input.description.trim() || null,
    event_date: input.event_date,
    event_time: input.event_time.trim() || null,
    ticket_url: input.ticket_url.trim() || null,
    vip_only: input.vip_only,
  };
}

export async function createWineryEventAction(wineryId: string, input: EventInput): Promise<PortalActionResult> {
  if (!(await isCurrentUserStaffFor(wineryId))) return { error: "Not authorized" };
  if (!input.title.trim() || !input.event_date) return { error: "Title and date are required" };

  const supabase = await createClient();
  const { error } = await supabase.from("winery_events").insert({ winery_id: wineryId, ...cleanInput(input) });
  if (error) return { error: error.message };

  revalidatePath("/portal/events");
  revalidatePath("/portal");
  revalidatePath("/vip");
  revalidatePath("/");
}

export async function updateWineryEventAction(
  wineryId: string,
  eventId: string,
  input: EventInput
): Promise<PortalActionResult> {
  if (!(await isCurrentUserStaffFor(wineryId))) return { error: "Not authorized" };
  if (!input.title.trim() || !input.event_date) return { error: "Title and date are required" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("winery_events")
    .update(cleanInput(input))
    .eq("id", eventId)
    .eq("winery_id", wineryId);
  if (error) return { error: error.message };

  revalidatePath("/portal/events");
  revalidatePath("/vip");
  revalidatePath("/");
}

export async function deleteWineryEventAction(wineryId: string, eventId: string): Promise<PortalActionResult> {
  if (!(await isCurrentUserStaffFor(wineryId))) return { error: "Not authorized" };

  const supabase = await createClient();
  const { error } = await supabase.from("winery_events").delete().eq("id", eventId).eq("winery_id", wineryId);
  if (error) return { error: error.message };

  revalidatePath("/portal/events");
  revalidatePath("/portal");
  revalidatePath("/vip");
  revalidatePath("/");
}
