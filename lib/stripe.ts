import "server-only";
import Stripe from "stripe";
import { env, isStripeConfigured } from "@/lib/env";

let stripe: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (!isStripeConfigured()) return null;
  if (!stripe) {
    stripe = new Stripe(env.stripeSecretKey!, {
      apiVersion: "2024-06-20",
    });
  }
  return stripe;
}
