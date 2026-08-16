import { NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { ShareType } from "@/lib/types";

export async function POST(request: Request) {
  const { wineryId, shareType } = (await request.json()) as {
    wineryId?: string | null;
    shareType?: ShareType;
  };

  if (!shareType) {
    return NextResponse.json({ error: "shareType is required" }, { status: 400 });
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

    await supabase
      .from("share_events")
      .insert({ user_id: user.id, winery_id: wineryId ?? null, share_type: shareType });
    return NextResponse.json({ tracked: true });
  } catch {
    return NextResponse.json({ tracked: false });
  }
}
