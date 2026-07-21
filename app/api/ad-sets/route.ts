import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { AdVariation, SavedAdSet } from "@/lib/types";

function toAdSet(row: {
  id: string;
  topic: string;
  character_name: string;
  funnel_stage: string;
  platforms: string[] | null;
  payload: AdVariation[] | null;
  created_at: string;
}): SavedAdSet {
  return {
    id: row.id,
    topic: row.topic,
    characterName: row.character_name,
    funnelStage: row.funnel_stage,
    platforms: Array.isArray(row.platforms) ? row.platforms : [],
    ads: Array.isArray(row.payload) ? row.payload : [],
    createdAt: row.created_at,
  };
}

const COLUMNS =
  "id, topic, character_name, funnel_stage, platforms, payload, created_at";

function notConfigured() {
  return NextResponse.json(
    { error: "Ad sets require Supabase. Running in local mode." },
    { status: 503 },
  );
}

/** GET /api/ad-sets — list the signed-in user's saved ad sets. */
export async function GET() {
  if (!isSupabaseConfigured()) return notConfigured();

  const supabase = createClient()!;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("ad_sets")
    .select(COLUMNS)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: (data ?? []).map(toAdSet) });
}

/**
 * POST /api/ad-sets — save a generated ad set.
 * Body: { topic, characterName, funnelStage, platforms[], ads[] }
 */
export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) return notConfigured();

  const supabase = createClient()!;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const topic = typeof body.topic === "string" ? body.topic.slice(0, 2000) : "";
  const characterName =
    typeof body.characterName === "string"
      ? body.characterName.slice(0, 200)
      : "";
  const funnelStage =
    typeof body.funnelStage === "string" ? body.funnelStage.slice(0, 40) : "";
  const platforms: string[] = Array.isArray(body.platforms)
    ? body.platforms.filter((p: unknown) => typeof p === "string")
    : [];
  const ads: AdVariation[] = Array.isArray(body.ads) ? body.ads : [];

  const { data, error } = await supabase
    .from("ad_sets")
    .insert({
      user_id: user.id,
      topic,
      character_name: characterName,
      funnel_stage: funnelStage,
      platforms,
      payload: ads,
    })
    .select(COLUMNS)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: toAdSet(data) }, { status: 201 });
}
