import { NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { SEED_WINERIES, FOUNDING_TRAIL } from "@/lib/seed-data";
import { evaluateDistance } from "@/lib/geo";
import type { Winery } from "@/lib/types";

interface CheckinBody {
  wineryId?: string;
  latitude?: number;
  longitude?: number;
}

const NOT_CLOSE_MESSAGE =
  "It looks like you're not quite at the winery yet. Visit the tasting room to collect your trail stamp.";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as CheckinBody;
  const { wineryId, latitude, longitude } = body;

  if (
    !wineryId ||
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    Number.isNaN(latitude) ||
    Number.isNaN(longitude)
  ) {
    return NextResponse.json({ error: "wineryId and valid coordinates are required" }, { status: 400 });
  }

  // --- Resolve the winery's authoritative coordinates and radius server-side.
  // The client never supplies these — that's what prevents faked check-ins.
  let winery: Winery | null = null;

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data } = await supabase.from("wineries").select("*").eq("id", wineryId).single();
    winery = (data as Winery) ?? null;
  }
  if (!winery) {
    winery = SEED_WINERIES.find((w) => w.id === wineryId) ?? null;
  }

  if (!winery) {
    return NextResponse.json({ error: "Winery not found" }, { status: 404 });
  }

  const distance = evaluateDistance(
    latitude,
    longitude,
    winery.latitude,
    winery.longitude,
    winery.checkin_radius_meters
  );

  if (!distance.withinRadius) {
    return NextResponse.json(
      {
        verified: false,
        message: NOT_CLOSE_MESSAGE,
        distanceMeters: Math.round(distance.meters),
      },
      { status: 403 }
    );
  }

  if (!isSupabaseConfigured) {
    return NextResponse.json({
      verified: true,
      demo: true,
      message: "Supabase isn't configured yet, so this stamp won't be saved to a real trail card.",
      checkin: {
        id: `demo-${wineryId}`,
        winery_id: wineryId,
        checkin_date: new Date().toISOString(),
      },
    });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "You must be signed in to check in." }, { status: 401 });
  }

  const { data: existing } = await supabase
    .from("checkins")
    .select("*")
    .eq("user_id", user.id)
    .eq("winery_id", wineryId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ verified: true, alreadyCheckedIn: true, checkin: existing });
  }

  const { data: checkin, error: insertError } = await supabase
    .from("checkins")
    .insert({
      user_id: user.id,
      winery_id: wineryId,
      latitude,
      longitude,
      distance_meters: Math.round(distance.meters),
      verified: true,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: "Could not save your check-in. Please try again." }, { status: 500 });
  }

  // If this completes the Founding Trail, record the trail completion.
  const { data: trail } = await supabase
    .from("trails")
    .select("id")
    .eq("slug", "founding-trail")
    .maybeSingle();
  const trailId = trail?.id ?? FOUNDING_TRAIL.id;

  const { data: trailWineryIds } = await supabase
    .from("trail_wineries")
    .select("winery_id")
    .eq("trail_id", trailId);

  const { data: userCheckins } = await supabase
    .from("checkins")
    .select("winery_id")
    .eq("user_id", user.id);

  const requiredIds = (trailWineryIds ?? SEED_WINERIES.map((w) => ({ winery_id: w.id }))).map(
    (r) => r.winery_id
  );
  const visitedIds = new Set((userCheckins ?? []).map((c) => c.winery_id));
  const trailComplete = requiredIds.every((id) => visitedIds.has(id));

  let completion = null;
  if (trailComplete) {
    const { data } = await supabase
      .from("trail_completions")
      .upsert(
        { user_id: user.id, trail_id: trailId },
        { onConflict: "user_id,trail_id", ignoreDuplicates: true }
      )
      .select()
      .maybeSingle();
    completion = data;
  }

  return NextResponse.json({ verified: true, checkin, trailComplete, completion });
}
