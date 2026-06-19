import "server-only";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  isAnthropicConfigured,
  isSupabaseConfigured,
} from "@/lib/env";

export const FREE_MONTHLY_LIMIT = 5;

export interface UsageState {
  plan: "free" | "pro";
  used: number;
  limit: number | null; // null = unlimited
  remaining: number | null;
}

/**
 * Wraps an AI route handler with auth + quota enforcement.
 *
 * Behavior:
 *  - If Anthropic isn't configured → 503 with a friendly message.
 *  - If Supabase isn't configured → demo mode: allow the call, skip metering.
 *  - Otherwise → require a logged-in user, enforce the freemium quota, and
 *    record the generation after a successful response.
 */
export async function withQuota(
  handler: () => Promise<unknown>,
): Promise<NextResponse> {
  if (!isAnthropicConfigured()) {
    return NextResponse.json(
      {
        error:
          "AI is not configured yet. Add ANTHROPIC_API_KEY to .env.local to enable generation.",
      },
      { status: 503 },
    );
  }

  // Demo mode — no database to meter against.
  if (!isSupabaseConfigured()) {
    try {
      const data = await handler();
      return NextResponse.json({ data, usage: null });
    } catch (err) {
      return handleError(err);
    }
  }

  const supabase = createClient()!;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const usage = await getUsage(user.id);

  if (usage.remaining !== null && usage.remaining <= 0) {
    return NextResponse.json(
      {
        error: `You've used all ${usage.limit} free generations this month. Upgrade to Pro for unlimited.`,
        usage,
        upgrade: true,
      },
      { status: 402 },
    );
  }

  try {
    const data = await handler();
    await recordGeneration(user.id);
    const after = await getUsage(user.id);
    return NextResponse.json({ data, usage: after });
  } catch (err) {
    return handleError(err);
  }
}

function handleError(err: unknown): NextResponse {
  const message =
    err instanceof Error ? err.message : "Something went wrong generating.";
  console.error("[AppForge AI error]", err);
  return NextResponse.json({ error: message }, { status: 500 });
}

/**
 * Reads the user's plan and this calendar month's generation count.
 */
export async function getUsage(userId: string): Promise<UsageState> {
  const supabase = createClient()!;

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .maybeSingle();

  const plan = (profile?.plan as "free" | "pro") ?? "free";

  if (plan === "pro") {
    return { plan, used: 0, limit: null, remaining: null };
  }

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("generations")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", monthStart.toISOString());

  const used = count ?? 0;
  return {
    plan,
    used,
    limit: FREE_MONTHLY_LIMIT,
    remaining: Math.max(0, FREE_MONTHLY_LIMIT - used),
  };
}

async function recordGeneration(userId: string): Promise<void> {
  const supabase = createClient()!;
  await supabase.from("generations").insert({ user_id: userId });
}
