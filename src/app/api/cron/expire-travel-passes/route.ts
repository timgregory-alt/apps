import { NextResponse } from "next/server";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";

/** Flips is_subscriber back to false for anyone whose Travel Pass has
 * expired — only for a travel-pass-only guest (no stripe_subscription_id),
 * so a real subscriber who happens to have bought a Travel Pass in the
 * past is never touched by this. Runs daily, not instantly on expiry —
 * a few hours of grace past the exact 2-day mark is an acceptable
 * tradeoff against needing a per-request expiry check everywhere
 * is_subscriber is read. */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 200 });
  }

  try {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from("profiles")
      .update({ is_subscriber: false })
      .lt("travel_pass_expires_at", new Date().toISOString())
      .is("stripe_subscription_id", null)
      .eq("is_subscriber", true)
      .select("id");

    if (error) throw error;

    return NextResponse.json({ expired: data?.length ?? 0 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
