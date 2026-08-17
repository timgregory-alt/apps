import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/server";
import type { Winery } from "@/lib/types";

const MAX_PAGE_CHARS = 60000;
/** Don't bother extracting events further out than this — most sites only
 * publish a rolling window anyway, and it keeps the model focused. */
const LOOKAHEAD_DAYS = 120;

interface ExtractedEvent {
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
}

const EVENT_LIST_SCHEMA = {
  type: "object" as const,
  properties: {
    events: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          title: { type: "string" as const },
          description: { anyOf: [{ type: "string" as const }, { type: "null" as const }] },
          event_date: { type: "string" as const },
          event_time: { anyOf: [{ type: "string" as const }, { type: "null" as const }] },
        },
        required: ["title", "description", "event_date", "event_time"],
        additionalProperties: false,
      },
    },
  },
  required: ["events"],
  additionalProperties: false,
};

async function fetchPageText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "TennesseeWinePassportBot/1.0 (+https://tennesseewinepassport.com)" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Fetch failed with status ${res.status}`);
  const html = await res.text();
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_PAGE_CHARS);
}

async function extractEvents(
  wineryName: string,
  pageText: string,
  todayISO: string,
  existingEvents: string[]
): Promise<ExtractedEvent[]> {
  const client = new Anthropic();

  const response = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 4096,
    system:
      "You extract upcoming event listings from a winery's own web page text for a wine-trail app. " +
      `Today's date is ${todayISO}. Only extract events on or after today — never past events. ` +
      "Extract things like live music, harvest weekends, food truck nights, wine club pickup parties, " +
      "and similar scheduled happenings. Do not extract regular tasting-room hours, wine club sign-up " +
      "pages, or generic marketing copy as if they were events. " +
      "event_date must be a real calendar date in YYYY-MM-DD format — infer the year from context " +
      "(assume the nearest future occurrence of any date/day mentioned without a year). If a listing " +
      "gives only a recurring pattern with no specific date (e.g. \"live music every Friday\") and no " +
      "concrete upcoming date can be inferred, skip it rather than guessing. " +
      "event_time should be a short free-text range like \"6:00 PM - 9:00 PM\" if the page states one, " +
      "otherwise null. description should be 1-2 concise sentences using only what the page actually " +
      "says — never invent details. Never include an event whose title matches (even loosely) one of " +
      "the already-known events listed below.",
    messages: [
      {
        role: "user",
        content:
          `Winery: ${wineryName}\n\n` +
          `Already-known upcoming events (do not re-extract these):\n${
            existingEvents.length ? existingEvents.join("; ") : "(none yet)"
          }\n\n` +
          `Page text:\n${pageText}`,
      },
    ],
    output_config: { format: { type: "json_schema", schema: EVENT_LIST_SCHEMA } },
  });

  const parsed = response.parsed_output as { events: ExtractedEvent[] } | null;
  const events = parsed?.events ?? [];

  const cutoff = new Date(todayISO);
  cutoff.setDate(cutoff.getDate() + LOOKAHEAD_DAYS);

  return events.filter((e) => {
    const d = new Date(e.event_date);
    return !Number.isNaN(d.getTime()) && e.event_date >= todayISO && d <= cutoff;
  });
}

export interface EventSyncResult {
  wineryId: string;
  wineryName: string;
  added: number;
  status: "ok" | "error";
  detail?: string;
}

export async function syncWineryEvents(winery: Winery): Promise<EventSyncResult> {
  const sourceUrl = winery.events_page_url ?? winery.website_url;
  const base: Omit<EventSyncResult, "status" | "detail"> = {
    wineryId: winery.id,
    wineryName: winery.name,
    added: 0,
  };

  if (!sourceUrl) {
    return { ...base, status: "ok", detail: "No events page URL configured — skipped." };
  }

  try {
    const supabase = await createAdminClient();
    const todayISO = new Date().toISOString().slice(0, 10);

    const { data: existing, error: fetchError } = await supabase
      .from("winery_events")
      .select("title")
      .eq("winery_id", winery.id)
      .gte("event_date", todayISO);
    if (fetchError) throw new Error(fetchError.message);

    const existingTitles = (existing ?? []).map((e) => e.title as string);

    const pageText = await fetchPageText(sourceUrl);
    const extracted = await extractEvents(winery.name, pageText, todayISO, existingTitles);

    if (extracted.length === 0) {
      return { ...base, status: "ok", detail: "No new events found." };
    }

    const rows = extracted.map((e) => ({
      winery_id: winery.id,
      title: e.title,
      description: e.description,
      event_date: e.event_date,
      event_time: e.event_time,
      source_url: sourceUrl,
    }));

    // Duplicate (winery_id, title, event_date) rows are expected across weekly
    // runs when a listing lingers on the page — ignore rather than error.
    const { error: insertError } = await supabase
      .from("winery_events")
      .upsert(rows, { onConflict: "winery_id,title,event_date", ignoreDuplicates: true });
    if (insertError) throw new Error(insertError.message);

    return { ...base, added: rows.length, status: "ok", detail: rows.map((r) => r.title).join(", ") };
  } catch (err) {
    return { ...base, status: "error", detail: err instanceof Error ? err.message : String(err) };
  }
}

export async function syncAllWineryEvents(): Promise<EventSyncResult[]> {
  const supabase = await createAdminClient();
  const { data: wineries, error } = await supabase.from("wineries").select("*").eq("active", true);
  if (error) throw new Error(error.message);

  const results: EventSyncResult[] = [];
  for (const winery of (wineries as Winery[]) ?? []) {
    const result = await syncWineryEvents(winery);
    results.push(result);

    await supabase.from("event_sync_log").insert({
      winery_id: winery.id,
      events_added: result.added,
      status: result.status,
      detail: result.detail ?? null,
    });
  }

  return results;
}
