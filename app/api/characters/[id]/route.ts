import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import {
  CHARACTER_COLUMNS,
  profileFromBody,
  toCharacter,
} from "@/lib/character-serialize";
import type { CharacterProfile } from "@/lib/types";

type Params = { params: { id: string } };

function notConfigured() {
  return NextResponse.json(
    { error: "Characters require Supabase. Running in local mode." },
    { status: 503 },
  );
}

/** GET /api/characters/:id — fetch a single character. */
export async function GET(_req: NextRequest, { params }: Params) {
  if (!isSupabaseConfigured()) return notConfigured();

  const supabase = createClient()!;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("characters")
    .select(CHARACTER_COLUMNS)
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Character not found." }, { status: 404 });
  }

  return NextResponse.json({ data: toCharacter(data) });
}

/**
 * PATCH /api/characters/:id — update name and/or profile fields.
 * Merges profile changes into the existing payload.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  if (!isSupabaseConfigured()) return notConfigured();

  const supabase = createClient()!;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  // Load current payload so we can merge, not clobber.
  const { data: existing, error: loadError } = await supabase
    .from("characters")
    .select("payload")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (loadError) {
    return NextResponse.json({ error: loadError.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "Character not found." }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const merged: Partial<CharacterProfile> = {
    ...((existing.payload as Partial<CharacterProfile>) ?? {}),
    ...profileFromBody(body),
  };

  const update: {
    name?: string;
    payload: Partial<CharacterProfile>;
    updated_at: string;
  } = { payload: merged, updated_at: new Date().toISOString() };
  if (typeof body.name === "string" && body.name.trim()) {
    update.name = body.name.trim().slice(0, 120);
  }

  const { data, error } = await supabase
    .from("characters")
    .update(update)
    .eq("id", params.id)
    .eq("user_id", user.id)
    .select(CHARACTER_COLUMNS)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Character not found." }, { status: 404 });
  }

  return NextResponse.json({ data: toCharacter(data) });
}

/** DELETE /api/characters/:id — remove a character. */
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
    .from("characters")
    .delete()
    .eq("id", params.id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
