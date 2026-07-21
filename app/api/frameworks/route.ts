import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { ExtractedFramework, SavedFramework } from "@/lib/types";

function toFramework(row: {
  id: string;
  name: string;
  payload: ExtractedFramework | null;
  created_at: string;
}): SavedFramework {
  const p = row.payload;
  return {
    id: row.id,
    name: row.name,
    framework:
      p && typeof p === "object"
        ? {
            name: p.name ?? row.name,
            tagline: p.tagline ?? "",
            promise: p.promise ?? "",
            steps: Array.isArray(p.steps) ? p.steps : [],
            teaching: p.teaching ?? "",
          }
        : {
            name: row.name,
            tagline: "",
            promise: "",
            steps: [],
            teaching: "",
          },
    createdAt: row.created_at,
  };
}

const COLUMNS = "id, name, payload, created_at";

function notConfigured() {
  return NextResponse.json(
    { error: "Frameworks require Supabase. Running in local mode." },
    { status: 503 },
  );
}

/** GET /api/frameworks — list the signed-in user's saved frameworks. */
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
    .from("frameworks")
    .select(COLUMNS)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: (data ?? []).map(toFramework) });
}

/**
 * POST /api/frameworks — save an extracted framework.
 * Body: { name, framework }
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
  const framework: ExtractedFramework | null =
    body.framework && typeof body.framework === "object"
      ? body.framework
      : null;
  const name =
    typeof body.name === "string" && body.name.trim()
      ? body.name.trim().slice(0, 200)
      : framework?.name?.slice(0, 200) || "Untitled framework";

  if (!framework) {
    return NextResponse.json(
      { error: "A framework is required." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("frameworks")
    .insert({ user_id: user.id, name, payload: framework })
    .select(COLUMNS)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: toFramework(data) }, { status: 201 });
}
