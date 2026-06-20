import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { SavedListing, StoreListing } from "@/lib/types";

/** Maps a DB row to the client-facing SavedListing shape. */
function toSaved(row: {
  id: string;
  app_name: string | null;
  payload: StoreListing;
  created_at: string;
}): SavedListing {
  return {
    id: row.id,
    appName: row.app_name ?? "",
    listing: row.payload,
    createdAt: row.created_at,
  };
}

/**
 * GET /api/listings — list the signed-in user's saved store listings.
 *
 * Persistence lives behind these routes only when Supabase is configured; in
 * demo mode the client uses localStorage and never calls them.
 */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Saved listings require Supabase. Running in local mode." },
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
    .from("listings")
    .select("id, app_name, payload, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: (data ?? []).map(toSaved) });
}

/**
 * POST /api/listings — save a generated listing.
 * Body: { appName: string; listing: StoreListing }
 */
export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Saved listings require Supabase. Running in local mode." },
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
  const appName = typeof body.appName === "string" ? body.appName.trim() : "";
  const listing = body.listing as StoreListing | undefined;
  if (!listing || typeof listing !== "object") {
    return NextResponse.json(
      { error: "A listing payload is required." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("listings")
    .insert({ user_id: user.id, app_name: appName, payload: listing })
    .select("id, app_name, payload, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: toSaved(data) }, { status: 201 });
}
