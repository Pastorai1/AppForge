"use client";

import { useState } from "react";
import { callAi } from "@/lib/api";
import type { AppAnalysis } from "@/lib/types";
import { Spinner, ErrorBanner } from "@/components/ui";

/**
 * Deep-dive analysis modal shared by the Top Apps explorer and the
 * Opportunities finder. Runs the /api/ai/app-analysis route on demand.
 */
export function AppAnalysisModal({
  name,
  oneLiner,
  category,
  onClose,
}: {
  name: string;
  oneLiner: string;
  category: string;
  onClose: () => void;
}) {
  const [analysis, setAnalysis] = useState<AppAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await callAi<AppAnalysis>("/api/ai/app-analysis", {
        name,
        oneLiner,
        category,
      });
      setAnalysis(data);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-surface p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">{name}</h2>
            <p className="text-sm text-gray-400">{oneLiner}</p>
          </div>
          <button onClick={onClose} className="chip hover:border-primary">
            Close
          </button>
        </div>

        {!analysis && !loading && (
          <button onClick={run} className="btn-primary mt-5">
            Run AI analysis
          </button>
        )}

        {loading && (
          <div className="mt-5">
            <Spinner label="Analyzing…" />
          </div>
        )}
        {error ? (
          <div className="mt-5">
            <ErrorBanner error={error} />
          </div>
        ) : null}

        {analysis && (
          <div className="mt-5 space-y-5 text-sm">
            <p className="text-gray-300">{analysis.summary}</p>
            <Section title="Why it works" items={analysis.whyItWorks} />
            <div>
              <h4 className="font-semibold text-white">Monetization</h4>
              <p className="mt-1 text-gray-400">
                {analysis.monetizationBreakdown}
              </p>
            </div>
            <Section title="Weaknesses" items={analysis.weaknesses} />
            <Section title="Opportunities" items={analysis.opportunities} />
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="font-semibold text-white">{title}</h4>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-gray-400">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
