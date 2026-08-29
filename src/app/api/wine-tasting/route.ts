import { NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { wineId, rating } = (await request.json().catch(() => ({}))) as {
    wineId?: string;
    rating?: number;
  };

  if (!wineId || !Number.isInteger(rating) || (rating as number) < 1 || (rating as number) > 5) {
    return NextResponse.json({ error: "wineId and a rating from 1-5 are required" }, { status: 400 });
  }

  if (!isSupabaseConfigured) {
    return NextResponse.json({ saved: false, demo: true });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "You must be signed in to rate wines." }, { status: 401 });
  }

  const { data: wine } = await supabase.from("wines").select("winery_id").eq("id", wineId).single();
  if (!wine) {
    return NextResponse.json({ error: "Wine not found." }, { status: 404 });
  }

  const { data: checkin } = await supabase
    .from("checkins")
    .select("id")
    .eq("user_id", user.id)
    .eq("winery_id", wine.winery_id)
    .maybeSingle();
  if (!checkin) {
    return NextResponse.json(
      { error: "Check in at this winery before rating its wines." },
      { status: 403 }
    );
  }

  const { error } = await supabase
    .from("wine_tastings")
    .upsert({ user_id: user.id, wine_id: wineId, rating }, { onConflict: "user_id,wine_id" });

  if (error) {
    return NextResponse.json({ error: "Could not save your rating. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ saved: true });
}
