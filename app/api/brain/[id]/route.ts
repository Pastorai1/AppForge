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
type Params = { params: { id: string } };

function notConfigured() {
  return NextResponse.json(
    { error: "The Brain requires Supabase. Running in local mode." },
    { status: 503 },
  );
}

/** PATCH /api/brain/:id — edit a fact's content and/or category. */
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
    content?: string;
    category?: string;
    updated_at: string;
  } = { updated_at: new Date().toISOString() };
  if (typeof body.content === "string" && body.content.trim()) {
    update.content = body.content.trim();
  }
  if (typeof body.category === "string" && body.category.trim()) {
    update.category = body.category.trim();
  }

  const { data, error } = await supabase
    .from("brain_facts")
    .update(update)
    .eq("id", params.id)
    .eq("user_id", user.id)
    .select(COLUMNS)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Fact not found." }, { status: 404 });
  }

  return NextResponse.json({ data: toFact(data) });
}

/** DELETE /api/brain/:id — remove a fact. */
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
    .from("brain_facts")
    .delete()
    .eq("id", params.id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
