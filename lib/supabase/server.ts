import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env, isSupabaseConfigured } from "@/lib/env";

/**
 * Server-side Supabase client bound to the request cookies.
 * Returns `null` when Supabase isn't configured (UI/demo mode).
 */
export function createClient() {
  if (!isSupabaseConfigured()) return null;

  const cookieStore = cookies();

  return createServerClient(env.supabaseUrl!, env.supabaseAnonKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options: CookieOptions }[],
      ) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component — middleware refreshes the session,
          // so this can be safely ignored.
        }
      },
    },
  });
}

/**
 * Privileged server client using the service-role key. Used by the Stripe
 * webhook to update subscription state. Bypasses RLS — never expose to clients.
 */
export function createAdminClient() {
  if (!env.supabaseUrl || !env.supabaseServiceKey) return null;

  return createServerClient(env.supabaseUrl, env.supabaseServiceKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {
        /* no-op: admin client is not request-scoped */
      },
    },
  });
}
