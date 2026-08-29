import { NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { WineStyle } from "@/lib/types";

const STYLES: WineStyle[] = ["red", "white", "rose", "sweet", "sparkling", "mead"];

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    wineryId?: string;
    name?: string;
    style?: WineStyle;
    notes?: string;
    foodPairing?: string;
    liked?: boolean;
  };

  const name = body.name?.trim();

  if (!body.wineryId || !name || !body.style || !STYLES.includes(body.style) || typeof body.liked !== "boolean") {
    return NextResponse.json(
      { error: "wineryId, name, a valid style, and liked are required" },
      { status: 400 }
    );
  }

  if (!isSupabaseConfigured) {
    return NextResponse.json({ saved: false, demo: true });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "You must be signed in to log a wine." }, { status: 401 });
  }

  const { data: checkin } = await supabase
    .from("checkins")
    .select("id")
    .eq("user_id", user.id)
    .eq("winery_id", body.wineryId)
    .maybeSingle();
  if (!checkin) {
    return NextResponse.json(
      { error: "Check in at this winery before logging a wine you tried." },
      { status: 403 }
    );
  }

  const { data, error } = await supabase
    .from("custom_wine_tastings")
    .insert({
      user_id: user.id,
      winery_id: body.wineryId,
      name,
      style: body.style,
      notes: body.notes?.trim() || null,
      food_pairing: body.foodPairing?.trim() || null,
      liked: body.liked,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Could not save that wine. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ saved: true, tasting: data });
}

export async function DELETE(request: Request) {
  const { id } = (await request.json().catch(() => ({}))) as { id?: string };

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  if (!isSupabaseConfigured) {
    return NextResponse.json({ deleted: false, demo: true });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const { error } = await supabase
    .from("custom_wine_tastings")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Could not remove that wine." }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
