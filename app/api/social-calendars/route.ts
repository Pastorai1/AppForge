import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { SavedSocialCalendar, SocialPost } from "@/lib/types";

function toCalendar(row: {
  id: string;
  topic: string;
  character_name: string;
  platforms: string[] | null;
  payload: SocialPost[] | null;
  created_at: string;
}): SavedSocialCalendar {
  return {
    id: row.id,
    topic: row.topic,
    characterName: row.character_name,
    platforms: Array.isArray(row.platforms) ? row.platforms : [],
    posts: Array.isArray(row.payload) ? row.payload : [],
    createdAt: row.created_at,
  };
}

const COLUMNS = "id, topic, character_name, platforms, payload, created_at";

function notConfigured() {
  return NextResponse.json(
    { error: "Social calendars require Supabase. Running in local mode." },
    { status: 503 },
  );
}

/** GET /api/social-calendars — list the signed-in user's saved calendars. */
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
    .from("social_calendars")
    .select(COLUMNS)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: (data ?? []).map(toCalendar) });
}

/**
 * POST /api/social-calendars — save a generated calendar.
 * Body: { topic, characterName, platforms[], posts[] }
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
  const platforms: string[] = Array.isArray(body.platforms)
    ? body.platforms.filter((p: unknown) => typeof p === "string")
    : [];
  const posts: SocialPost[] = Array.isArray(body.posts) ? body.posts : [];

  const { data, error } = await supabase
    .from("social_calendars")
    .insert({
      user_id: user.id,
      topic,
      character_name: characterName,
      platforms,
      payload: posts,
    })
    .select(COLUMNS)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: toCalendar(data) }, { status: 201 });
}
