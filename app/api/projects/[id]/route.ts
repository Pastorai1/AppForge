import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { PROJECT_STAGES, type Project } from "@/lib/types";

const PROJECT_COLUMNS = "id, title, description, stage, score";

type Params = { params: { id: string } };

/**
 * PATCH /api/projects/:id — update a project's stage (kanban move).
 * Body: { stage: ProjectStage }
 *
 * The `user_id` filter plus RLS ensures a user can only mutate their own rows.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
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
  if (!PROJECT_STAGES.includes(body.stage)) {
    return NextResponse.json(
      { error: "A valid stage is required." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("projects")
    .update({ stage: body.stage })
    .eq("id", params.id)
    .eq("user_id", user.id)
    .select(PROJECT_COLUMNS)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  return NextResponse.json({ data: data as Project });
}

/**
 * DELETE /api/projects/:id — remove one of the user's projects.
 */
export async function DELETE(_req: NextRequest, { params }: Params) {
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

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", params.id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
