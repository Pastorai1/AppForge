import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { MarketAnalysis, SavedMarketAnalysis } from "@/lib/types";

/** Maps a DB row to the client-facing SavedMarketAnalysis shape. */
function toSaved(row: {
  id: string;
  category: string;
  payload: MarketAnalysis;
  created_at: string;
}): SavedMarketAnalysis {
  return {
    id: row.id,
    category: row.category,
    analysis: row.payload,
    createdAt: row.created_at,
  };
}

/**
 * GET /api/market-analyses — list the signed-in user's saved market analyses,
 * newest first. Distinct from /api/ai/market-analysis, which generates them.
 *
 * Persistence lives behind these routes only when Supabase is configured; in
 * demo mode the client uses localStorage and never calls them.
 */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Market analysis history requires Supabase. Running in local mode." },
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
    .from("market_analyses")
    .select("id, category, payload, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: (data ?? []).map(toSaved) });
}

/**
 * POST /api/market-analyses — save a generated analysis to history.
 * Body: { category: string; analysis: MarketAnalysis }
 */
export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Market analysis history requires Supabase. Running in local mode." },
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
  const category = typeof body.category === "string" ? body.category.trim() : "";
  const analysis = body.analysis as MarketAnalysis | undefined;
  if (!category || !analysis || typeof analysis !== "object") {
    return NextResponse.json(
      { error: "A category and analysis payload are required." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("market_analyses")
    .insert({ user_id: user.id, category, payload: analysis })
    .select("id, category, payload, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: toSaved(data) }, { status: 201 });
}
