import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { AppOpportunity, SavedItem, TopApp } from "@/lib/types";

function toSaved(row: {
  id: string;
  kind: SavedItem["kind"];
  item_key: string;
  payload: TopApp | AppOpportunity;
  created_at: string;
}): SavedItem {
  return {
    id: row.id,
    kind: row.kind,
    itemKey: row.item_key,
    payload: row.payload,
    createdAt: row.created_at,
  };
}

const COLUMNS = "id, kind, item_key, payload, created_at";

/**
 * GET /api/saved-items[?kind=top_app|opportunity] — list the user's bookmarks.
 */
export async function GET(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Saved items require Supabase. Running in local mode." },
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

  const kind = new URL(req.url).searchParams.get("kind");

  let query = supabase
    .from("saved_items")
    .select(COLUMNS)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (kind === "top_app" || kind === "opportunity") {
    query = query.eq("kind", kind);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: (data ?? []).map(toSaved) });
}

/**
 * POST /api/saved-items — bookmark an item (idempotent via upsert).
 * Body: { kind: "top_app" | "opportunity"; itemKey: string; payload: object }
 */
export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Saved items require Supabase. Running in local mode." },
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
  const kind = body.kind;
  const itemKey =
    typeof body.itemKey === "string" ? body.itemKey.trim().toLowerCase() : "";
  const payload = body.payload;
  if (
    (kind !== "top_app" && kind !== "opportunity") ||
    !itemKey ||
    !payload ||
    typeof payload !== "object"
  ) {
    return NextResponse.json({ error: "Invalid item." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("saved_items")
    .upsert(
      { user_id: user.id, kind, item_key: itemKey, payload },
      { onConflict: "user_id,kind,item_key" },
    )
    .select(COLUMNS)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: toSaved(data) }, { status: 201 });
}
