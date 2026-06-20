import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { SavedViabilityScore, ViabilityScore } from "@/lib/types";

function toSaved(row: {
  id: string;
  idea: string | null;
  payload: ViabilityScore;
  created_at: string;
}): SavedViabilityScore {
  return {
    id: row.id,
    idea: row.idea ?? "",
    score: row.payload,
    createdAt: row.created_at,
  };
}

/**
 * GET /api/viability-scores — list the signed-in user's saved viability
 * scores, newest first. (Generation happens at /api/ai/viability.)
 */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Viability history requires Supabase. Running in local mode." },
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
    .from("viability_scores")
    .select("id, idea, payload, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: (data ?? []).map(toSaved) });
}

/**
 * POST /api/viability-scores — save a score to history.
 * Body: { idea: string; score: ViabilityScore }
 */
export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Viability history requires Supabase. Running in local mode." },
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
  const idea = typeof body.idea === "string" ? body.idea.trim() : "";
  const score = body.score as ViabilityScore | undefined;
  if (!score || typeof score !== "object") {
    return NextResponse.json(
      { error: "A score payload is required." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("viability_scores")
    .insert({ user_id: user.id, idea, payload: score })
    .select("id, idea, payload, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: toSaved(data) }, { status: 201 });
}
