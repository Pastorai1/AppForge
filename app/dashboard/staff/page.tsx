"use client";

import { useEffect, useRef, useState } from "react";
import { callAi } from "@/lib/api";
import type { BuildMessage, StaffSession } from "@/lib/types";
import {
  getStaffSessions,
  getStaffSession,
  createStaffSession,
  updateStaffSession,
  deleteStaffSession,
} from "@/lib/staff-store";
import { getBrainFacts, formatBrainContext } from "@/lib/brain-store";
import { PageHeader, ErrorBanner } from "@/components/ui";

const WELCOME: BuildMessage = {
  role: "assistant",
  content:
    "I'm your Chief of Staff. I know your business from your Brain, and I'm here to help you decide what to work on and actually move it forward — marketing, offers, audience, growth, launches, whatever's on your plate.\n\nWhat are we tackling today?",
};

export default function StaffPage() {
  const [sessions, setSessions] = useState<StaffSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<BuildMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const brainRef = useRef<string>("");
  const brainLoadedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  async function loadBrain() {
    if (brainLoadedRef.current) return brainRef.current;
    try {
      const facts = await getBrainFacts();
      brainRef.current = formatBrainContext(facts);
    } catch {
      brainRef.current = "";
    }
    brainLoadedRef.current = true;
    return brainRef.current;
  }

  async function init() {
    void loadBrain();
    try {
      setSessions(await getStaffSessions());
    } catch {
      /* non-fatal */
    }
  }

  async function newConversation() {
    setError(null);
    setSending(true);
    try {
      const session = await createStaffSession({
        title: "New conversation",
        messages: [WELCOME],
      });
      setActiveId(session.id);
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
    const session = await getStaffSession(id);
    if (!session) return;
    setActiveId(session.id);
    setMessages(session.messages.length ? session.messages : [WELCOME]);
  }

  async function removeSession(id: string) {
    const snapshot = sessions;
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeId === id) {
      setActiveId(null);
      setMessages([]);
    }
    try {
      await deleteStaffSession(id);
    } catch {
      setSessions(snapshot);
    }
  }

  /** Calls the Chief of Staff for the next reply and persists the result. */
  async function getReply(sessionId: string, history: BuildMessage[]) {
    const brainContext = await loadBrain();
    const { data } = await callAi<{ reply: string }>("/api/ai/staff", {
      brainContext,
      messages: history,
    });
    const assistant: BuildMessage = { role: "assistant", content: data.reply };
    const finalMessages = [...history, assistant];
    setMessages(finalMessages);

    // Title the conversation from the founder's first message.
    const firstUser = history.find((m) => m.role === "user");
    const patch: { messages: BuildMessage[]; title?: string } = {
      messages: finalMessages,
    };
    const current = sessions.find((s) => s.id === sessionId);
    if (firstUser && (!current || current.title === "New conversation")) {
      patch.title = firstUser.content.slice(0, 80);
    }

    try {
      const updated = await updateStaffSession(sessionId, patch);
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
      await getReply(activeId, history);
    } catch (e) {
      setError(e);
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Chief of Staff"
        subtitle="Your account-wide AI partner. Grounded in your Brain, it helps you decide what to do next and get it done."
      />

      {error ? (
        <div className="mb-4">
          <ErrorBanner error={error} />
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-[260px_1fr]">
        {/* Conversation list */}
        <div className="space-y-3">
          <button
            onClick={newConversation}
            disabled={sending}
            className="btn-primary w-full"
          >
            + New conversation
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
                  aria-label="Delete conversation"
                >
                  ✕
                </button>
              </div>
            ))}
            {sessions.length === 0 && (
              <p className="px-1 text-xs text-gray-500">
                No conversations yet. Start one and ask your Chief of Staff
                what to work on next.
              </p>
            )}
          </div>
        </div>

        {/* Chat */}
        <div className="flex h-[70vh] flex-col rounded-xl border border-border bg-surface/50">
          {activeId ? (
            <>
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
                    placeholder="Ask your Chief of Staff…"
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
                  Start a conversation with your Chief of Staff. It knows your
                  business from your{" "}
                  <span className="text-gray-200">Brain</span> and helps you
                  decide what to do next.
                </p>
                <button onClick={newConversation} className="btn-primary mt-4">
                  + New conversation
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
