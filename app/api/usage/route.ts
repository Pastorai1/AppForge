import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUsage } from "@/lib/usage";
import { isSupabaseConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ usage: null, demo: true });
  }

  const supabase = createClient()!;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ usage: null });
  }

  const usage = await getUsage(user.id);
  return NextResponse.json({ usage });
}
