"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
  const supabase = createClient();
  const configured = supabase !== null;
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback`
      : undefined;

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setStatus("sending");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else {
      setStatus("sent");
    }
  }

  async function signInWithGoogle() {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
  }

  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Link href="/">
            <Logo className="text-lg" />
          </Link>
        </div>

        <div className="card">
          <h1 className="text-xl font-semibold text-white">Welcome back</h1>
          <p className="mt-1 text-sm text-gray-400">
            Sign in to your AppForge account.
          </p>

          {!configured && (
            <div className="mt-4 rounded-lg border border-yellow-700/40 bg-yellow-900/20 p-3 text-sm text-yellow-300">
              Auth isn&apos;t configured yet. Add your Supabase keys to
              <code className="mx-1 rounded bg-black/30 px-1">.env.local</code>
              to enable sign-in. You can still explore the dashboard in demo
              mode.
            </div>
          )}

          <form onSubmit={sendMagicLink} className="mt-5 space-y-3">
            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                disabled={!configured}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input"
              />
            </div>
            <button
              type="submit"
              disabled={!configured || status === "sending"}
              className="btn-primary w-full"
            >
              {status === "sending" ? "Sending…" : "Email me a magic link"}
            </button>
          </form>

          {status === "sent" && (
            <p className="mt-3 text-sm text-green-400">
              Check your inbox for a sign-in link.
            </p>
          )}
          {status === "error" && (
            <p className="mt-3 text-sm text-red-400">{message}</p>
          )}

          <div className="my-5 flex items-center gap-3 text-xs text-gray-500">
            <span className="h-px flex-1 bg-border" />
            OR
            <span className="h-px flex-1 bg-border" />
          </div>

          <button
            onClick={signInWithGoogle}
            disabled={!configured}
            className="btn-ghost w-full"
          >
            Continue with Google
          </button>

          <div className="mt-5 text-center">
            <Link
              href="/dashboard"
              className="text-sm text-primary hover:underline"
            >
              Skip — explore in demo mode →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
