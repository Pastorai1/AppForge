"use client";

import { useState } from "react";
import { callAi } from "@/lib/api";
import type { ViabilityScore } from "@/lib/types";
import { addLocalProject } from "@/lib/projects-store";
import { PageHeader, Spinner, ErrorBanner, ScoreBar } from "@/components/ui";

const STEPS: { key: string; label: string; placeholder: string }[] = [
  {
    key: "idea",
    label: "What's the app idea? (one sentence)",
    placeholder: "An app that…",
  },
  {
    key: "audience",
    label: "Who is the target audience?",
    placeholder: "e.g. busy parents, indie runners, small landlords",
  },
  {
    key: "problem",
    label: "What problem does it solve?",
    placeholder: "The pain point and why it matters",
  },
  {
    key: "monetization",
    label: "How will it make money?",
    placeholder: "e.g. $5/mo subscription after a 7-day trial",
  },
  {
    key: "competition",
    label: "Who are the competitors and how are you different?",
    placeholder: "Existing apps and your edge",
  },
  {
    key: "capability",
    label: "What can you build, and with what resources?",
    placeholder: "Your skills, budget, and timeline",
  },
  {
    key: "gtm",
    label: "How will you get your first 100 users?",
    placeholder: "Your go-to-market plan",
  },
];

export default function ViabilityPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ViabilityScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [saved, setSaved] = useState(false);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  function update(value: string) {
    setAnswers((a) => ({ ...a, [current.key]: value }));
  }

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await callAi<ViabilityScore>("/api/ai/viability", {
        answers,
      });
      setResult(data);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStep(0);
    setAnswers({});
    setResult(null);
    setError(null);
    setSaved(false);
  }

  function saveProject() {
    if (!result) return;
    addLocalProject({
      title: answers.idea?.slice(0, 80) || "Untitled idea",
      description: answers.problem || "",
      score: result.overall,
    });
    setSaved(true);
  }

  if (result) {
    return (
      <div>
        <PageHeader title="Viability Score" />
        <div className="card mb-6 text-center">
          <div className="text-5xl font-bold text-primary">
            {result.overall}
            <span className="text-2xl text-gray-500">/100</span>
          </div>
          <p className="mt-2 text-gray-300">{result.verdict}</p>
        </div>

        <div className="card mb-6 space-y-4">
          <ScoreBar label="Market opportunity" value={result.market} />
          <ScoreBar label="Monetization" value={result.monetization} />
          <ScoreBar label="Competitive edge" value={result.competitiveEdge} />
          <ScoreBar label="Build feasibility" value={result.buildFeasibility} />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <ListCard title="Strengths" items={result.strengths} />
          <ListCard title="Risks" items={result.risks} />
          <ListCard title="Recommendations" items={result.recommendations} />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={saveProject} disabled={saved} className="btn-primary">
            {saved ? "Saved to Projects ✓" : "Save as project"}
          </button>
          <button onClick={reset} className="btn-ghost">
            Score another idea
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Viability Scorer"
        subtitle={`Step ${step + 1} of ${STEPS.length}`}
      />

      <div className="mb-4 h-1.5 w-full rounded-full bg-surface-2">
        <div
          className="h-1.5 rounded-full bg-primary transition-all"
          style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      <div className="card">
        <label className="label">{current.label}</label>
        <textarea
          value={answers[current.key] ?? ""}
          onChange={(e) => update(e.target.value)}
          placeholder={current.placeholder}
          rows={4}
          className="input resize-none"
        />

        {error ? (
          <div className="mt-4">
            <ErrorBanner error={error} />
          </div>
        ) : null}

        <div className="mt-5 flex items-center justify-between">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="btn-ghost"
          >
            Back
          </button>

          {isLast ? (
            <button
              onClick={submit}
              disabled={loading || !answers[current.key]?.trim()}
              className="btn-primary"
            >
              {loading ? "Scoring…" : "Score my idea"}
            </button>
          ) : (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!answers[current.key]?.trim()}
              className="btn-primary"
            >
              Next
            </button>
          )}
        </div>
        {loading && (
          <div className="mt-4">
            <Spinner label="Scoring your idea…" />
          </div>
        )}
      </div>
    </div>
  );
}

function ListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="card">
      <h3 className="font-semibold text-white">{title}</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-400">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
