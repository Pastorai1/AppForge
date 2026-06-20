import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { env, isStripeConfigured, isSupabaseConfigured } from "@/lib/env";

export async function POST() {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Billing is not configured yet." },
      { status: 503 },
    );
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Sign-in is required to upgrade." },
      { status: 401 },
    );
  }

  const supabase = createClient()!;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const stripe = getStripe()!;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: env.stripeProPriceId!, quantity: 1 }],
    customer_email: user.email ?? undefined,
    client_reference_id: user.id,
    metadata: { userId: user.id },
    success_url: `${env.appUrl}/dashboard?upgraded=1`,
    cancel_url: `${env.appUrl}/dashboard/billing`,
  });

  return NextResponse.json({ url: session.url });
}
