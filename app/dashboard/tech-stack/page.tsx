"use client";

import { useEffect, useState } from "react";
import { callAi } from "@/lib/api";
import type { SavedTechStack, TechStackRecommendation } from "@/lib/types";
import {
  getTechStacks,
  saveTechStack,
  deleteTechStack,
} from "@/lib/tech-stack-store";
import { PageHeader, Spinner, ErrorBanner } from "@/components/ui";

interface Question {
  key: string;
  label: string;
  options: string[];
}

const QUESTIONS: Question[] = [
  {
    key: "platforms",
    label: "Which platforms do you need?",
    options: ["iOS only", "Android only", "iOS + Android", "Mobile + Web"],
  },
  {
    key: "experience",
    label: "What's your team's strongest background?",
    options: [
      "JavaScript / React",
      "Native (Swift / Kotlin)",
      "Dart / Flutter",
      "Little / no code yet",
    ],
  },
  {
    key: "complexity",
    label: "How much native / device functionality?",
    options: [
      "Mostly content & forms",
      "Some native (camera, maps, push)",
      "Heavy native (AR, BLE, background)",
    ],
  },
  {
    key: "timeline",
    label: "What's your timeline?",
    options: ["A weekend / MVP fast", "1–3 months", "6+ months, built to last"],
  },
  {
    key: "budget",
    label: "What's your budget posture?",
    options: ["Bootstrapped / free tools", "Some budget", "Well funded"],
  },
];

export default function TechStackPage() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<TechStackRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [history, setHistory] = useState<SavedTechStack[]>([]);

  const allAnswered = QUESTIONS.every((q) => answers[q.key]);

  useEffect(() => {
    getTechStacks()
      .then(setHistory)
      .catch(() => {
        /* non-fatal: history panel stays empty */
      });
  }, []);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await callAi<TechStackRecommendation>(
        "/api/ai/tech-stack",
        { answers },
      );
      setResult(data);

      // Auto-save to history. Non-fatal: a save hiccup must not hide the result.
      try {
        const entry = await saveTechStack({
          label: data.recommended?.name ?? "Recommendation",
          recommendation: data,
        });
        setHistory((prev) => [entry, ...prev]);
      } catch {
        /* ignore — the result still displays */
      }
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  function loadFromHistory(entry: SavedTechStack) {
    setResult(entry.recommendation);
    setError(null);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function removeFromHistory(id: string) {
    const snapshot = history;
    setHistory((prev) => prev.filter((t) => t.id !== id));
    try {
      await deleteTechStack(id);
    } catch {
      setHistory(snapshot);
    }
  }

  return (
    <div>
      <PageHeader
        title="Tech Stack Recommender"
        subtitle="Answer 5 questions to get a recommended stack, alternatives, and a roadmap."
      />

      <div className="card mb-6 space-y-5">
        {QUESTIONS.map((q) => (
          <div key={q.key}>
            <span className="label">{q.label}</span>
            <div className="flex flex-wrap gap-2">
              {q.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() =>
                    setAnswers((a) => ({ ...a, [q.key]: opt }))
                  }
                  className={`chip ${
                    answers[q.key] === opt
                      ? "chip-active"
                      : "hover:border-primary"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
        <button
          onClick={run}
          disabled={!allAnswered || loading}
          className="btn-primary"
        >
          {loading ? "Thinking…" : "Recommend my stack"}
        </button>
      </div>

      {history.length > 0 && (
        <div className="card mb-6">
          <h2 className="mb-3 text-sm font-semibold text-white">History</h2>
          <div className="space-y-2">
            {history.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2"
              >
                <button
                  onClick={() => loadFromHistory(t)}
                  className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
                  title="Open this recommendation"
                >
                  <span className="truncate text-sm font-medium text-gray-200 hover:text-primary">
                    {t.label || "Recommendation"}
                  </span>
                  <span className="shrink-0 text-xs text-gray-500">
                    {new Date(t.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </button>
                <button
                  onClick={() => removeFromHistory(t.id)}
                  className="shrink-0 text-xs text-gray-500 hover:text-red-400"
                  aria-label="Delete saved recommendation"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && <Spinner label="Choosing the right stack…" />}
      {error ? <ErrorBanner error={error} /> : null}

      {result && (
        <div className="space-y-6">
          <div className="card border-primary">
            <div className="text-xs uppercase tracking-wide text-primary">
              Recommended
            </div>
            <h2 className="mt-1 text-2xl font-bold text-white">
              {result.recommended.name}
            </h2>
            <p className="mt-2 text-sm text-gray-300">
              {result.recommended.rationale}
            </p>
          </div>

          <div>
            <h3 className="mb-3 font-semibold text-white">Alternatives</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {result.alternatives.map((a) => (
                <div key={a.name} className="card">
                  <h4 className="font-medium text-white">{a.name}</h4>
                  <p className="mt-1 text-sm text-gray-400">{a.whenToUse}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 font-semibold text-white">
              Getting-started roadmap
            </h3>
            <ol className="space-y-3">
              {result.roadmap.map((r, i) => (
                <li key={i} className="card flex gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <div className="font-medium text-white">{r.step}</div>
                    <p className="mt-1 text-sm text-gray-400">{r.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
