"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/ui";

type Msg = { type: "error" | "success"; text: string } | null;

export default function AccountPage() {
  // Create the browser client once so it isn't re-instantiated each render.
  const [supabase] = useState(() => createClient());
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);

  useEffect(() => {
    supabase?.auth
      .getUser()
      .then(({ data }) => setEmail(data.user?.email ?? null));
  }, [supabase]);

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    if (password.length < 6) {
      setMsg({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }
    if (password !== confirm) {
      setMsg({ type: "error", text: "Passwords don't match." });
      return;
    }
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMsg({ type: "error", text: error.message });
    } else {
      setMsg({
        type: "success",
        text: "Password saved. You can now sign in with your email and password.",
      });
      setPassword("");
      setConfirm("");
    }
    setBusy(false);
  }

  if (!supabase) {
    return (
      <div>
        <PageHeader title="Account" />
        <div className="card text-sm text-gray-400">
          Account settings require Supabase. Running in demo mode.
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Account"
        subtitle="Manage your sign-in and account details."
      />

      <div className="card mb-6">
        <div className="text-xs uppercase tracking-wide text-gray-500">
          Signed in as
        </div>
        <div className="mt-1 text-sm text-gray-200">{email ?? "…"}</div>
      </div>

      <div className="card max-w-md">
        <h2 className="font-semibold text-white">Set a password</h2>
        <p className="mt-1 text-sm text-gray-400">
          Set a password so you can sign in directly next time instead of using
          a magic link.
        </p>

        <form onSubmit={savePassword} className="mt-4 space-y-3">
          <div>
            <label className="label" htmlFor="new-password">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input"
              autoComplete="new-password"
              minLength={6}
            />
          </div>
          <div>
            <label className="label" htmlFor="confirm-password">
              Confirm password
            </label>
            <input
              id="confirm-password"
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              className="input"
              autoComplete="new-password"
              minLength={6}
            />
          </div>
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? "Saving…" : "Save password"}
          </button>
        </form>

        {msg && (
          <p
            className={`mt-3 text-sm ${
              msg.type === "error" ? "text-red-400" : "text-green-400"
            }`}
          >
            {msg.text}
          </p>
        )}
      </div>
    </div>
  );
}
