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

type Params = { params: { id: string } };

function notConfigured() {
  return NextResponse.json(
    { error: "Build sessions require Supabase. Running in local mode." },
    { status: 503 },
  );
}

/** GET /api/build-sessions/:id — fetch a single session. */
export async function GET(_req: NextRequest, { params }: Params) {
  if (!isSupabaseConfigured()) return notConfigured();

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
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  return NextResponse.json({ data: toSession(data) });
}

/**
 * PATCH /api/build-sessions/:id — update messages and/or title.
 * Body: { messages?: BuildMessage[]; title?: string }
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  if (!isSupabaseConfigured()) return notConfigured();

  const supabase = createClient()!;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const update: {
    messages?: BuildMessage[];
    title?: string;
    updated_at: string;
  } = { updated_at: new Date().toISOString() };

  if (Array.isArray(body.messages)) update.messages = body.messages;
  if (typeof body.title === "string" && body.title.trim()) {
    update.title = body.title.trim().slice(0, 120);
  }

  const { data, error } = await supabase
    .from("build_sessions")
    .update(update)
    .eq("id", params.id)
    .eq("user_id", user.id)
    .select(COLUMNS)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  return NextResponse.json({ data: toSession(data) as BuildSession });
}

/** DELETE /api/build-sessions/:id — remove a session. */
export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!isSupabaseConfigured()) return notConfigured();

  const supabase = createClient()!;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { error } = await supabase
    .from("build_sessions")
    .delete()
    .eq("id", params.id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
