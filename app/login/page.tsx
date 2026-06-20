"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";

type Msg = { type: "error" | "success" | "info"; text: string } | null;

export default function LoginPage() {
  const supabase = createClient();
  const configured = supabase !== null;

  const [mode, setMode] = useState<"password" | "magic">("password");
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);

  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback`
      : undefined;

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setMsg(null);

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) {
        setMsg({ type: "error", text: error.message });
      } else if (data.session) {
        window.location.assign("/dashboard");
        return;
      } else {
        setMsg({
          type: "info",
          text: "Account created — check your email to confirm, then sign in.",
        });
        setIsSignUp(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setMsg({ type: "error", text: error.message });
      } else {
        window.location.assign("/dashboard");
        return;
      }
    }
    setBusy(false);
  }

  async function handleMagicSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) setMsg({ type: "error", text: error.message });
    else setMsg({ type: "success", text: "Check your inbox for a sign-in link." });
    setBusy(false);
  }

  async function handleForgotPassword() {
    if (!supabase) return;
    if (!email) {
      setMsg({ type: "error", text: "Enter your email above first, then click reset." });
      return;
    }
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo:
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback?next=/dashboard/account`
          : undefined,
    });
    if (error) setMsg({ type: "error", text: error.message });
    else
      setMsg({
        type: "success",
        text: "Password reset email sent — click the link to set a new password.",
      });
    setBusy(false);
  }

  async function signInWithGoogle() {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
  }

  const msgColor =
    msg?.type === "error"
      ? "text-red-400"
      : msg?.type === "success"
        ? "text-green-400"
        : "text-gray-300";

  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Link href="/">
            <Logo className="text-lg" />
          </Link>
        </div>

        <div className="card">
          <h1 className="text-xl font-semibold text-white">
            {isSignUp ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            {mode === "magic"
              ? "We'll email you a one-time sign-in link."
              : isSignUp
                ? "Sign up with your email and a password."
                : "Sign in with your email and password."}
          </p>

          {!configured && (
            <div className="mt-4 rounded-lg border border-yellow-700/40 bg-yellow-900/20 p-3 text-sm text-yellow-300">
              Auth isn&apos;t configured yet. Add your Supabase keys to
              <code className="mx-1 rounded bg-black/30 px-1">.env.local</code>
              to enable sign-in. You can still explore the dashboard in demo
              mode.
            </div>
          )}

          <form
            onSubmit={mode === "magic" ? handleMagicSubmit : handlePasswordSubmit}
            className="mt-5 space-y-3"
          >
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
                autoComplete="email"
              />
            </div>

            {mode === "password" && (
              <div>
                <label className="label" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  disabled={!configured}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  minLength={6}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={!configured || busy}
              className="btn-primary w-full"
            >
              {busy
                ? "Working…"
                : mode === "magic"
                  ? "Email me a magic link"
                  : isSignUp
                    ? "Create account"
                    : "Sign in"}
            </button>
          </form>

          {msg && <p className={`mt-3 text-sm ${msgColor}`}>{msg.text}</p>}

          {configured && (
            <div className="mt-4 space-y-2 text-sm">
              {mode === "password" ? (
                <>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => {
                        setIsSignUp((v) => !v);
                        setMsg(null);
                      }}
                      className="text-primary hover:underline"
                    >
                      {isSignUp
                        ? "Already have an account? Sign in"
                        : "New here? Create an account"}
                    </button>
                    {!isSignUp && (
                      <button
                        onClick={handleForgotPassword}
                        className="text-gray-400 hover:text-white"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setMode("magic");
                      setMsg(null);
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    Use a magic link instead
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setMode("password");
                    setMsg(null);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  Use a password instead
                </button>
              )}
            </div>
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
