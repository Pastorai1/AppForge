import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

type Params = { params: { id: string } };

/**
 * DELETE /api/tech-stacks/:id — remove one saved recommendation from history.
 */
export async function DELETE(_req: NextRequest, { params }: Params) {
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

  const { error } = await supabase
    .from("tech_stacks")
    .delete()
    .eq("id", params.id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
