import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import {
  CHARACTER_COLUMNS,
  profileFromBody,
  toCharacter,
} from "@/lib/character-serialize";

function notConfigured() {
  return NextResponse.json(
    { error: "Characters require Supabase. Running in local mode." },
    { status: 503 },
  );
}

/** GET /api/characters — list the signed-in user's character profiles. */
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
    .from("characters")
    .select(CHARACTER_COLUMNS)
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: (data ?? []).map(toCharacter) });
}

/**
 * POST /api/characters — create a character profile.
 * Body: { name?: string; identity?, backstory?, voice?, audience?, signaturePhrases?, avoid? }
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
  const name =
    typeof body.name === "string" && body.name.trim()
      ? body.name.trim().slice(0, 120)
      : "New character";
  const payload = profileFromBody(body);

  const { data, error } = await supabase
    .from("characters")
    .insert({ user_id: user.id, name, payload })
    .select(CHARACTER_COLUMNS)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: toCharacter(data) }, { status: 201 });
}
