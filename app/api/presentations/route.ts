import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { PresentationSection, SavedPresentation } from "@/lib/types";

function toPresentation(row: {
  id: string;
  topic: string;
  character_name: string;
  payload: PresentationSection[] | null;
  created_at: string;
}): SavedPresentation {
  return {
    id: row.id,
    topic: row.topic,
    characterName: row.character_name,
    sections: Array.isArray(row.payload) ? row.payload : [],
    createdAt: row.created_at,
  };
}

const COLUMNS = "id, topic, character_name, payload, created_at";

function notConfigured() {
  return NextResponse.json(
    { error: "Presentations require Supabase. Running in local mode." },
    { status: 503 },
  );
}

/** GET /api/presentations — list the signed-in user's saved presentations. */
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
    .from("presentations")
    .select(COLUMNS)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: (data ?? []).map(toPresentation) });
}

/**
 * POST /api/presentations — save a generated presentation.
 * Body: { topic, characterName, sections[] }
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
  const sections: PresentationSection[] = Array.isArray(body.sections)
    ? body.sections
    : [];

  const { data, error } = await supabase
    .from("presentations")
    .insert({
      user_id: user.id,
      topic,
      character_name: characterName,
      payload: sections,
    })
    .select(COLUMNS)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: toPresentation(data) }, { status: 201 });
}
