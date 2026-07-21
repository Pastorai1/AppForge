import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { GeneratedEmail, SavedEmailSequence } from "@/lib/types";

function toSequence(row: {
  id: string;
  type: string;
  label: string;
  topic: string;
  character_name: string;
  payload: GeneratedEmail[] | null;
  created_at: string;
}): SavedEmailSequence {
  return {
    id: row.id,
    type: row.type as SavedEmailSequence["type"],
    label: row.label,
    topic: row.topic,
    characterName: row.character_name,
    emails: Array.isArray(row.payload) ? row.payload : [],
    createdAt: row.created_at,
  };
}

const COLUMNS = "id, type, label, topic, character_name, payload, created_at";

function notConfigured() {
  return NextResponse.json(
    { error: "Email sequences require Supabase. Running in local mode." },
    { status: 503 },
  );
}

/** GET /api/email-sequences — list the signed-in user's saved sequences. */
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
    .from("email_sequences")
    .select(COLUMNS)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: (data ?? []).map(toSequence) });
}

/**
 * POST /api/email-sequences — save a generated sequence.
 * Body: { type, label, topic, characterName, emails[] }
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
  const type = typeof body.type === "string" ? body.type : "welcome";
  const label = typeof body.label === "string" ? body.label : "";
  const topic = typeof body.topic === "string" ? body.topic.slice(0, 2000) : "";
  const characterName =
    typeof body.characterName === "string" ? body.characterName.slice(0, 200) : "";
  const emails: GeneratedEmail[] = Array.isArray(body.emails) ? body.emails : [];

  const { data, error } = await supabase
    .from("email_sequences")
    .insert({
      user_id: user.id,
      type,
      label,
      topic,
      character_name: characterName,
      payload: emails,
    })
    .select(COLUMNS)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: toSequence(data) }, { status: 201 });
}
