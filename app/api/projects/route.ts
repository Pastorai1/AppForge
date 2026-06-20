import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { PROJECT_STAGES, type Project, type ProjectStage } from "@/lib/types";

/** Columns we expose to the client — maps 1:1 onto the `Project` type. */
const PROJECT_COLUMNS = "id, title, description, stage, score";

/**
 * GET /api/projects — list the signed-in user's projects, newest first.
 *
 * Persistence lives behind these routes only when Supabase is configured. In
 * demo mode the client never calls them (it uses localStorage instead), so a
 * 503 here is just a safety net.
 */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Projects sync requires Supabase. Running in local mode." },
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
    .from("projects")
    .select(PROJECT_COLUMNS)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: (data ?? []) as Project[] });
}

/**
 * POST /api/projects — create a project for the signed-in user.
 * Body: { title: string; description?: string; score?: number | null; stage?: ProjectStage }
 */
export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Projects sync requires Supabase. Running in local mode." },
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
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  const description =
    typeof body.description === "string" ? body.description : "";
  const score = typeof body.score === "number" ? Math.round(body.score) : null;
  const stage: ProjectStage = PROJECT_STAGES.includes(body.stage)
    ? body.stage
    : "Scoping";

  const { data, error } = await supabase
    .from("projects")
    .insert({ user_id: user.id, title, description, score, stage })
    .select(PROJECT_COLUMNS)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data as Project }, { status: 201 });
}
