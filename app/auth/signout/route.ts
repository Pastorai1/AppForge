import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

export async function POST() {
  const supabase = createClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  return NextResponse.redirect(`${env.appUrl}/login`, { status: 303 });
}
