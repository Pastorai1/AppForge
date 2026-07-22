"use client";

import { useEffect, useRef, useState } from "react";
import { callAi } from "@/lib/api";
import type {
  BuildMessage,
  ExtractedFramework,
  SavedFramework,
} from "@/lib/types";
import { getBrainFacts, formatBrainContext } from "@/lib/brain-store";
import {
  getFrameworks,
  createFramework,
  deleteFramework,
} from "@/lib/frameworks-store";
import { PageHeader, ErrorBanner } from "@/components/ui";

const WELCOME: BuildMessage = {
  role: "assistant",
  content:
    "Let's uncover and name your signature framework — the repeatable way you get results that you could teach, package, or sell.\n\nTo start: what's a result you consistently help people achieve? Describe, in your own words, how you actually do it.",
};

export default function FrameworksPage() {
  const [messages, setMessages] = useState<BuildMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [framework, setFramework] = useState<ExtractedFramework | null>(null);
  const [history, setHistory] = useState<SavedFramework[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [copied, setCopied] = useState(false);

  const brainRef = useRef<string>("");
  const brainLoadedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const answers = messages.filter((m) => m.role === "user").length;
  const canExtract = answers >= 2;

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
      brainRef.current = formatBrainContext(await getBrainFacts());
    } catch {
      brainRef.current = "";
    }
    brainLoadedRef.current = true;
    return brainRef.current;
  }

  async function init() {
    void loadBrain();
    try {
      setHistory(await getFrameworks());
    } catch {
      /* non-fatal */
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    const history = [...messages, { role: "user", content: text } as BuildMessage];
    setMessages(history);
    setInput("");
    setSending(true);
    setError(null);
    try {
      const brainContext = await loadBrain();
      const { data } = await callAi<{ reply: string }>(
        "/api/ai/framework/interview",
        { brainContext, messages: history },
      );
      setMessages([...history, { role: "assistant", content: data.reply }]);
    } catch (e) {
      setError(e);
    } finally {
      setSending(false);
    }
  }

  async function extract() {
    if (extracting || !canExtract) return;
    setExtracting(true);
    setError(null);
    try {
      const brainContext = await loadBrain();
      const { data } = await callAi<ExtractedFramework>(
        "/api/ai/framework/extract",
        { brainContext, messages },
      );
      setFramework(data);
      try {
        const saved = await createFramework({ name: data.name, framework: data });
        setHistory((prev) => [saved, ...prev]);
      } catch {
        /* keep on-screen result even if saving hiccups */
      }
      if (typeof window !== "undefined")
        window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e);
    } finally {
      setExtracting(false);
    }
  }

  function newInterview() {
    setMessages([WELCOME]);
    setFramework(null);
    setInput("");
    setError(null);
  }

  function frameworkText(f: ExtractedFramework): string {
    const steps = f.steps
      .map((s, i) => `${i + 1}. ${s.name} — ${s.description}`)
      .join("\n");
    return `${f.name}\n${f.tagline}\n\nPromise: ${f.promise}\n\nSteps:\n${steps}\n\nHow to teach it:\n${f.teaching}`;
  }

  async function copyFramework(f: ExtractedFramework) {
    try {
      await navigator.clipboard.writeText(frameworkText(f));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  async function removeHistory(id: string) {
    const snapshot = history;
    setHistory((prev) => prev.filter((s) => s.id !== id));
    try {
      await deleteFramework(id);
    } catch {
      setHistory(snapshot);
    }
  }

  return (
    <div>
      <PageHeader
        title="Framework Extractor"
        subtitle="Answer a few questions and AppForge will name and structure your signature framework — turning your expertise into something teachable and sellable."
      />

      {error ? (
        <div className="mb-4">
          <ErrorBanner error={error} />
        </div>
      ) : null}

      {/* Extracted framework */}
      {framework && (
        <div className="card mb-6 space-y-3 border-primary/50">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">
                {framework.name}
              </h2>
              {framework.tagline && (
                <p className="text-sm text-primary">{framework.tagline}</p>
              )}
            </div>
            <button
              onClick={() => copyFramework(framework)}
              className="shrink-0 text-xs text-gray-400 hover:text-white"
            >
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>
          {framework.promise && (
            <p className="text-sm text-gray-300">
              <span className="text-gray-500">Promise:</span> {framework.promise}
            </p>
          )}
          <div className="space-y-2">
            {framework.steps.map((s, i) => (
              <div key={i} className="rounded-lg border border-border bg-surface p-3">
                <p className="text-sm font-semibold text-white break-words">
                  {i + 1}. {s.name}
                </p>
                <p className="mt-1 break-words text-sm text-gray-300">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
          {framework.teaching && (
            <div className="rounded-lg border border-border bg-surface-2 p-3">
              <p className="text-xs font-semibold uppercase text-gray-500">
                How to teach / package it
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-200">
                {framework.teaching}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Interview */}
      <div className="mb-6 flex h-[60vh] flex-col rounded-xl border border-border bg-surface/50">
        <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
          <span className="text-xs text-gray-500">
            Interview — the more specific you are, the better the framework.
          </span>
          <div className="flex gap-2">
            <button
              onClick={newInterview}
              className="btn-ghost text-xs"
              disabled={sending || extracting}
            >
              New
            </button>
            <button
              onClick={extract}
              disabled={!canExtract || sending || extracting}
              className="btn-primary text-sm disabled:opacity-50"
              title={
                canExtract
                  ? "Name and structure your framework"
                  : "Answer a couple of questions first"
              }
            >
              {extracting ? "Extracting…" : "✨ Extract my framework"}
            </button>
          </div>
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
              placeholder="Answer the question…"
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
      </div>

      {/* History */}
      {history.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-white">
            Saved frameworks
          </h2>
          <div className="space-y-2">
            {history.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2"
              >
                <button
                  onClick={() => setFramework(f.framework)}
                  className="min-w-0 flex-1 text-left text-sm text-gray-200 hover:text-primary"
                >
                  <span className="font-medium">{f.name}</span>
                  {f.framework.tagline ? (
                    <span className="block truncate text-xs text-gray-500">
                      {f.framework.tagline}
                    </span>
                  ) : null}
                </button>
                <button
                  onClick={() => removeHistory(f.id)}
                  className="shrink-0 text-xs text-gray-500 hover:text-red-400"
                  aria-label="Delete framework"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
