import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { BuildMessage, BuildSession } from "@/lib/types";

function toSession(row: {
  id: string;
  title: string;
  reference_app: string | null;
  messages: BuildMessage[];
  created_at: string;
  updated_at: string;
}): BuildSession {
  return {
    id: row.id,
    title: row.title,
    referenceApp: row.reference_app,
    messages: Array.isArray(row.messages) ? row.messages : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const COLUMNS = "id, title, reference_app, messages, created_at, updated_at";

/**
 * GET /api/build-sessions — list the signed-in user's build sessions,
 * most-recently-updated first.
 */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Build sessions require Supabase. Running in local mode." },
      { status: 503 },
    );
  }

  const supabase = createClient()!;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("build_sessions")
    .select(COLUMNS)
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: (data ?? []).map(toSession) });
}

/**
 * POST /api/build-sessions — create a build session.
 * Body: { title?: string; referenceApp?: string | null; messages?: BuildMessage[] }
 */
export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Build sessions require Supabase. Running in local mode." },
      { status: 503 },
    );
  }

  const supabase = createClient()!;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const title =
    typeof body.title === "string" && body.title.trim()
      ? body.title.trim().slice(0, 120)
      : "New build";
  const referenceApp =
    typeof body.referenceApp === "string" ? body.referenceApp : null;
  const messages: BuildMessage[] = Array.isArray(body.messages)
    ? body.messages
    : [];

  const { data, error } = await supabase
    .from("build_sessions")
    .insert({
      user_id: user.id,
      title,
      reference_app: referenceApp,
      messages,
    })
    .select(COLUMNS)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: toSession(data) }, { status: 201 });
}
