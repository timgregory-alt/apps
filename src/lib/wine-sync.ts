import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/server";
import type { Winery, WineStyle } from "@/lib/types";

const MAX_PAGE_CHARS = 30000;

interface ExtractedWine {
  name: string;
  varietal: string;
  style: WineStyle;
  tasting_notes: string;
  food_pairing: string | null;
}

const WINE_LIST_SCHEMA = {
  type: "object" as const,
  properties: {
    wines: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          name: { type: "string" as const },
          varietal: { type: "string" as const },
          style: {
            type: "string" as const,
            enum: ["red", "white", "rose", "sweet", "sparkling"],
          },
          tasting_notes: { type: "string" as const },
          food_pairing: {
            anyOf: [{ type: "string" as const }, { type: "null" as const }],
          },
        },
        required: ["name", "varietal", "style", "tasting_notes", "food_pairing"],
        additionalProperties: false,
      },
    },
  },
  required: ["wines"],
  additionalProperties: false,
};

async function fetchMenuText(url: string): Promise<string> {
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

async function extractNewWines(
  wineryName: string,
  pageText: string,
  existingNames: string[]
): Promise<ExtractedWine[]> {
  const client = new Anthropic();

  const response = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 4096,
    system:
      "You extract wine listings from a winery's own web page text for a wine-trail app. " +
      "Only extract wines that are clearly and currently offered by this winery — ignore navigation, " +
      "unrelated products, other wineries mentioned in passing, and past/discontinued vintages called out as sold out. " +
      "Write tasting_notes as 1-2 concise sentences using only what the page actually says or clearly implies — " +
      "never invent flavor notes the page doesn't support. Set food_pairing to a short pairing suggestion only if " +
      "the page mentions one; otherwise null. Never include a wine whose name matches (even loosely — same wine, " +
      "different capitalization or vintage year) one of the already-known wines listed below.",
    messages: [
      {
        role: "user",
        content:
          `Winery: ${wineryName}\n\n` +
          `Already-known wines (do not re-extract these):\n${existingNames.length ? existingNames.join("; ") : "(none yet)"}\n\n` +
          `Page text:\n${pageText}`,
      },
    ],
    output_config: { format: { type: "json_schema", schema: WINE_LIST_SCHEMA } },
  });

  const parsed = response.parsed_output as { wines: ExtractedWine[] } | null;
  return parsed?.wines ?? [];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export interface SyncResult {
  wineryId: string;
  wineryName: string;
  added: number;
  status: "ok" | "error";
  detail?: string;
}

export async function syncWineryWines(winery: Winery): Promise<SyncResult> {
  const sourceUrl = winery.wine_menu_url ?? winery.website_url;
  const supabase = await createAdminClient();
  const base: Omit<SyncResult, "status" | "detail"> = { wineryId: winery.id, wineryName: winery.name, added: 0 };

  if (!sourceUrl) {
    return { ...base, status: "ok", detail: "No wine menu URL configured — skipped." };
  }

  try {
    const { data: existingWines, error: fetchError } = await supabase
      .from("wines")
      .select("name, sort_order")
      .eq("winery_id", winery.id)
      .order("sort_order", { ascending: false });
    if (fetchError) throw new Error(fetchError.message);

    const existingNames = (existingWines ?? []).map((w) => w.name);
    let nextSort = (existingWines?.[0]?.sort_order ?? 0) + 1;

    const pageText = await fetchMenuText(sourceUrl);
    const extracted = await extractNewWines(winery.name, pageText, existingNames);

    if (extracted.length === 0) {
      return { ...base, status: "ok", detail: "No new wines found." };
    }

    const rows = extracted.map((w) => ({
      winery_id: winery.id,
      name: w.name,
      slug: `${winery.slug}-${slugify(w.name)}-${Date.now().toString(36)}`,
      varietal: w.varietal,
      style: w.style,
      tasting_notes: w.tasting_notes,
      food_pairing: w.food_pairing,
      sort_order: nextSort++,
    }));

    const { error: insertError } = await supabase.from("wines").insert(rows);
    if (insertError) throw new Error(insertError.message);

    return { ...base, added: rows.length, status: "ok", detail: rows.map((r) => r.name).join(", ") };
  } catch (err) {
    return { ...base, status: "error", detail: err instanceof Error ? err.message : String(err) };
  }
}

export async function syncAllWineries(): Promise<SyncResult[]> {
  const supabase = await createAdminClient();
  const { data: wineries, error } = await supabase.from("wineries").select("*").eq("active", true);
  if (error) throw new Error(error.message);

  const results: SyncResult[] = [];
  for (const winery of (wineries as Winery[]) ?? []) {
    const result = await syncWineryWines(winery);
    results.push(result);

    await supabase.from("wine_sync_log").insert({
      winery_id: winery.id,
      wines_added: result.added,
      status: result.status,
      detail: result.detail ?? null,
    });
  }

  return results;
}
