"use client";

import { useState } from "react";
import { PageHeader, ErrorBanner } from "@/components/ui";

const FREE = [
  "5 AI generations / month",
  "All 6 tools",
  "Projects board (local)",
];

const PRO = [
  "Unlimited AI generations",
  "All 6 tools",
  "Priority model access",
  "Everything in Free",
];

export default function BillingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function upgrade() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const json = await res.json();
      if (res.ok && json.url) {
        window.location.href = json.url;
      } else {
        setError(new Error(json.error ?? "Could not start checkout."));
      }
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Billing"
        subtitle="Upgrade to Pro for unlimited AI generations."
      />

      {error ? (
        <div className="mb-6">
          <ErrorBanner error={error} />
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <h2 className="text-lg font-semibold text-white">Free</h2>
          <div className="mt-1 text-3xl font-bold text-white">
            $0<span className="text-base font-normal text-gray-500">/mo</span>
          </div>
          <ul className="mt-4 space-y-2 text-sm text-gray-400">
            {FREE.map((f) => (
              <li key={f}>• {f}</li>
            ))}
          </ul>
        </div>

        <div className="card border-primary">
          <h2 className="text-lg font-semibold text-white">Pro</h2>
          <div className="mt-1 text-3xl font-bold text-white">
            $9<span className="text-base font-normal text-gray-500">/mo</span>
          </div>
          <ul className="mt-4 space-y-2 text-sm text-gray-300">
            {PRO.map((f) => (
              <li key={f}>• {f}</li>
            ))}
          </ul>
          <button
            onClick={upgrade}
            disabled={loading}
            className="btn-primary mt-5 w-full"
          >
            {loading ? "Redirecting…" : "Upgrade to Pro"}
          </button>
        </div>
      </div>

      <p className="mt-6 text-xs text-gray-500">
        Billing requires Stripe to be configured. In demo mode this button will
        report that billing isn&apos;t set up.
      </p>
    </div>
  );
}
