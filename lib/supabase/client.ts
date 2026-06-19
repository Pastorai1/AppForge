"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env, isSupabaseConfigured } from "@/lib/env";

/**
 * Browser-side Supabase client. Returns `null` when Supabase isn't configured
 * yet (UI/demo mode) so callers can fall back gracefully.
 */
export function createClient() {
  if (!isSupabaseConfigured()) return null;
  return createBrowserClient(env.supabaseUrl!, env.supabaseAnonKey!);
}
