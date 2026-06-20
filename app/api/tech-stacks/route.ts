import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { SavedTechStack, TechStackRecommendation } from "@/lib/types";

function toSaved(row: {
  id: string;
  label: string | null;
  payload: TechStackRecommendation;
  created_at: string;
}): SavedTechStack {
  return {
    id: row.id,
    label: row.label ?? "",
    recommendation: row.payload,
    createdAt: row.created_at,
  };
}

/**
 * GET /api/tech-stacks — list the signed-in user's saved tech-stack
 * recommendations, newest first. (Generation happens at /api/ai/tech-stack.)
 */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Tech stack history requires Supabase. Running in local mode." },
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
    .from("tech_stacks")
    .select("id, label, payload, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: (data ?? []).map(toSaved) });
}

/**
 * POST /api/tech-stacks — save a recommendation to history.
 * Body: { label: string; recommendation: TechStackRecommendation }
 */
export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Tech stack history requires Supabase. Running in local mode." },
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
  const label = typeof body.label === "string" ? body.label.trim() : "";
  const recommendation = body.recommendation as
    | TechStackRecommendation
    | undefined;
  if (!recommendation || typeof recommendation !== "object") {
    return NextResponse.json(
      { error: "A recommendation payload is required." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("tech_stacks")
    .insert({ user_id: user.id, label, payload: recommendation })
    .select("id, label, payload, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: toSaved(data) }, { status: 201 });
}
