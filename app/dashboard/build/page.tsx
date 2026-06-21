"use client";

import { useEffect, useRef, useState } from "react";
import { callAi } from "@/lib/api";
import type { BuildMessage, BuildSession } from "@/lib/types";
import {
  getBuildSessions,
  getBuildSession,
  createBuildSession,
  updateBuildSession,
  deleteBuildSession,
} from "@/lib/build-store";
import { PageHeader, ErrorBanner } from "@/components/ui";
import { GenerateAppPanel } from "@/components/GenerateAppPanel";

const WELCOME: BuildMessage = {
  role: "assistant",
  content:
    "Hi! I'm your AppForge build coach. Tell me about the app you want to build — or describe an existing app you'd like to make a better version of — and I'll guide you step by step, all the way toward launching on the App Store and Google Play.\n\nWhat's your idea?",
};

export default function BuildPage() {
  const [sessions, setSessions] = useState<BuildSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<BuildMessage[]>([]);
  const [referenceApp, setReferenceApp] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const [showGenerate, setShowGenerate] = useState(false);

  const seededRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Has enough of a plan to generate code from (more than the welcome message).
  const canGenerate = messages.filter((m) => m.role === "user").length > 0;
  const buildPlan = () =>
    messages
      .map((m) => `${m.role === "user" ? "Founder" : "Coach"}: ${m.content}`)
      .join("\n\n");

  useEffect(() => {
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  async function init() {
    let list: BuildSession[] = [];
    try {
      list = await getBuildSessions();
      setSessions(list);
    } catch {
      /* non-fatal */
    }

    // Seed a new build from a Top-100 app (?ref=) or an Opportunity (?idea=).
    if (typeof window !== "undefined" && !seededRef.current) {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");
      const idea = params.get("idea");
      const desc = params.get("desc") ?? "";
      if (ref) {
        seededRef.current = true;
        window.history.replaceState({}, "", "/dashboard/build");
        await startFromReference(ref, desc);
        return;
      }
      if (idea) {
        seededRef.current = true;
        window.history.replaceState({}, "", "/dashboard/build");
        await startFromIdea(idea, desc);
        return;
      }
    }
  }

  async function startFromIdea(idea: string, desc: string) {
    const seed: BuildMessage = {
      role: "user",
      content: `I want to build this app idea: "${idea}"${
        desc ? ` — ${desc}` : ""
      }. Help me design and plan it, step by step toward launching it on the App Store and Google Play.`,
    };
    setError(null);
    setReferenceApp(null);
    setMessages([seed]);
    setSending(true);
    try {
      const session = await createBuildSession({
        title: idea.slice(0, 80),
        referenceApp: null,
        messages: [seed],
      });
      setActiveId(session.id);
      setSessions((prev) => [session, ...prev]);
      await getReply(session.id, null, [seed]);
    } catch (e) {
      setError(e);
    } finally {
      setSending(false);
    }
  }

  async function startFromReference(ref: string, desc: string) {
    const reference = desc ? `${ref}: ${desc}` : ref;
    const seed: BuildMessage = {
      role: "user",
      content: `I want to build a better version of "${ref}"${
        desc ? ` (${desc})` : ""
      }. Help me design a superior app and guide me step by step toward launching it on the App Store and Google Play.`,
    };
    setError(null);
    setReferenceApp(reference);
    setMessages([seed]);
    setSending(true);
    try {
      const session = await createBuildSession({
        title: `Better ${ref}`.slice(0, 80),
        referenceApp: reference,
        messages: [seed],
      });
      setActiveId(session.id);
      setSessions((prev) => [session, ...prev]);
      await getReply(session.id, reference, [seed]);
    } catch (e) {
      setError(e);
    } finally {
      setSending(false);
    }
  }

  async function newBuild() {
    setError(null);
    setSending(true);
    try {
      const session = await createBuildSession({
        title: "New build",
        referenceApp: null,
        messages: [WELCOME],
      });
      setActiveId(session.id);
      setReferenceApp(null);
      setMessages([WELCOME]);
      setSessions((prev) => [session, ...prev]);
    } catch (e) {
      setError(e);
    } finally {
      setSending(false);
    }
  }

  async function openSession(id: string) {
    setError(null);
    const session = await getBuildSession(id);
    if (!session) return;
    setActiveId(session.id);
    setReferenceApp(session.referenceApp);
    setMessages(session.messages.length ? session.messages : [WELCOME]);
  }

  async function removeSession(id: string) {
    const snapshot = sessions;
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeId === id) {
      setActiveId(null);
      setMessages([]);
      setReferenceApp(null);
    }
    try {
      await deleteBuildSession(id);
    } catch {
      setSessions(snapshot);
    }
  }

  /** Calls the coach for the next reply and persists the result. */
  async function getReply(
    sessionId: string,
    reference: string | null,
    history: BuildMessage[],
  ) {
    const { data } = await callAi<{ reply: string }>("/api/ai/build", {
      referenceApp: reference,
      messages: history,
    });
    const assistant: BuildMessage = { role: "assistant", content: data.reply };
    const finalMessages = [...history, assistant];
    setMessages(finalMessages);
    try {
      const updated = await updateBuildSession(sessionId, {
        messages: finalMessages,
      });
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? updated : s)),
      );
    } catch {
      /* keep the on-screen messages even if the save hiccups */
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || sending || !activeId) return;
    const userMsg: BuildMessage = { role: "user", content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setSending(true);
    setError(null);
    try {
      await getReply(activeId, referenceApp, history);
    } catch (e) {
      setError(e);
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Build"
        subtitle="Plan and shape your app with an AI coach, step by step toward the App Store and Google Play."
      />

      {error ? (
        <div className="mb-4">
          <ErrorBanner error={error} />
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-[260px_1fr]">
        {/* Sessions list */}
        <div className="space-y-3">
          <button onClick={newBuild} disabled={sending} className="btn-primary w-full">
            + New build
          </button>
          <div className="space-y-2">
            {sessions.map((s) => (
              <div
                key={s.id}
                className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 ${
                  s.id === activeId
                    ? "border-primary bg-surface-2"
                    : "border-border bg-surface"
                }`}
              >
                <button
                  onClick={() => openSession(s.id)}
                  className="min-w-0 flex-1 truncate text-left text-sm text-gray-200 hover:text-primary"
                  title={s.title}
                >
                  {s.title}
                </button>
                <button
                  onClick={() => removeSession(s.id)}
                  className="shrink-0 text-xs text-gray-500 hover:text-red-400"
                  aria-label="Delete build"
                >
                  ✕
                </button>
              </div>
            ))}
            {sessions.length === 0 && (
              <p className="px-1 text-xs text-gray-500">
                No builds yet. Start one, or click “Build a better version” on a
                Top 100 app.
              </p>
            )}
          </div>
        </div>

        {/* Chat */}
        <div className="flex h-[70vh] flex-col rounded-xl border border-border bg-surface/50">
          {activeId ? (
            <>
              <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
                <span className="text-xs text-gray-500">
                  Plan with the coach, then generate your app.
                </span>
                <button
                  onClick={() => setShowGenerate(true)}
                  disabled={!canGenerate || sending}
                  className="btn-primary text-sm disabled:opacity-50"
                  title={
                    canGenerate
                      ? "Generate a starter app from this plan"
                      : "Chat with the coach first"
                  }
                >
                  ⚙ Generate app code
                </button>
              </div>
              <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${
                      m.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                        m.role === "user"
                          ? "bg-primary text-white"
                          : "border border-border bg-surface text-gray-200"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm text-gray-500">
                      Thinking…
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-border p-3">
                <div className="flex items-end gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    placeholder="Describe your idea or answer the coach…"
                    rows={2}
                    className="input resize-none"
                  />
                  <button
                    onClick={send}
                    disabled={sending || !input.trim()}
                    className="btn-primary shrink-0"
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="grid flex-1 place-items-center p-6 text-center">
              <div>
                <p className="text-sm text-gray-400">
                  Start a new build, pick one from the list, or click{" "}
                  <span className="text-gray-200">“Build a better version”</span>{" "}
                  on a Top 100 app.
                </p>
                <button onClick={newBuild} className="btn-primary mt-4">
                  + New build
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showGenerate && (
        <GenerateAppPanel
          plan={buildPlan()}
          onClose={() => setShowGenerate(false)}
        />
      )}
    </div>
  );
}
