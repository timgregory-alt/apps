import { NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { wineryId } = await request.json();

  if (!wineryId || typeof wineryId !== "string") {
    return NextResponse.json({ error: "wineryId is required" }, { status: 400 });
  }

  if (!isSupabaseConfigured) {
    return NextResponse.json({ tracked: false });
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ tracked: false });
    }

    await supabase.from("wine_club_clicks").insert({ user_id: user.id, winery_id: wineryId });
    return NextResponse.json({ tracked: true });
  } catch {
    return NextResponse.json({ tracked: false });
  }
}
