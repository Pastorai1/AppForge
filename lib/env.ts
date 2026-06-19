/**
 * Centralized environment-variable access with "configured" guards.
 *
 * AppForge is built to run in two modes:
 *   1. UI / demo mode — no real credentials. Pages render, but AI/auth/billing
 *      calls return friendly "not configured" responses instead of crashing.
 *   2. Connected mode — real Supabase / Anthropic / Stripe keys in .env.local.
 *
 * These helpers let the rest of the app degrade gracefully when a service
 * hasn't been wired up yet, so a missing key never takes the whole app down.
 */

function clean(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  // Treat the .env.example placeholders as "not configured".
  if (trimmed.startsWith("your-") || trimmed.includes("your-project-ref")) {
    return undefined;
  }
  return trimmed;
}

export const env = {
  supabaseUrl: clean(process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  supabaseServiceKey: clean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  anthropicKey: clean(process.env.ANTHROPIC_API_KEY),
  stripeSecretKey: clean(process.env.STRIPE_SECRET_KEY),
  stripeWebhookSecret: clean(process.env.STRIPE_WEBHOOK_SECRET),
  stripeProPriceId: clean(process.env.STRIPE_PRO_PRICE_ID),
  appUrl: clean(process.env.NEXT_PUBLIC_APP_URL) ?? "http://localhost:3000",
};

export function isSupabaseConfigured(): boolean {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}

export function isAnthropicConfigured(): boolean {
  return Boolean(env.anthropicKey);
}

export function isStripeConfigured(): boolean {
  return Boolean(env.stripeSecretKey && env.stripeProPriceId);
}
