import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { BrainFact } from "@/lib/types";

function toFact(row: {
  id: string;
  category: string;
  content: string;
  created_at: string;
}): BrainFact {
  return {
    id: row.id,
    category: row.category,
    content: row.content,
    createdAt: row.created_at,
  };
}

const COLUMNS = "id, category, content, created_at";

/** GET /api/brain — list the signed-in user's business-context facts. */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "The Brain requires Supabase. Running in local mode." },
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
    .from("brain_facts")
    .select(COLUMNS)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: (data ?? []).map(toFact) });
}

/**
 * POST /api/brain — add one or many facts.
 * Body: { category: string; content: string }
 *   or: { category: string; contents: string[] }  (bulk paste — one fact per line)
 * Returns { data: BrainFact } for a single add, or { data: BrainFact[] } for bulk.
 */
export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "The Brain requires Supabase. Running in local mode." },
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
  const category =
    typeof body.category === "string" && body.category.trim()
      ? body.category.trim()
      : "Other";

  // Bulk add: one fact per non-empty line.
  if (Array.isArray(body.contents)) {
    const contents = body.contents
      .filter((c: unknown): c is string => typeof c === "string")
      .map((c: string) => c.trim())
      .filter(Boolean);
    if (!contents.length) {
      return NextResponse.json(
        { error: "No facts to add." },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("brain_facts")
      .insert(contents.map((content: string) => ({ user_id: user.id, category, content })))
      .select(COLUMNS);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { data: (data ?? []).map(toFact) },
      { status: 201 },
    );
  }

  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (!content) {
    return NextResponse.json({ error: "Content is required." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("brain_facts")
    .insert({ user_id: user.id, category, content })
    .select(COLUMNS)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: toFact(data) }, { status: 201 });
}
