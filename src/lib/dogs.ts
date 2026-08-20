import "server-only";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { SEED_DOGS } from "@/lib/seed-data";
import type { Dog } from "@/lib/types";

/** All four dog profiles, ordered for display — public, no login required.
 * This is what the /dog-sitter page reads. */
export async function getDogsPublic(): Promise<Dog[]> {
  if (!isSupabaseConfigured) return SEED_DOGS;
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("dogs").select("*").order("sort_order");
    return data && data.length > 0 ? (data as Dog[]) : SEED_DOGS;
  } catch {
    return SEED_DOGS;
  }
}
