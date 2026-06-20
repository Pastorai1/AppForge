"use client";

import { useState } from "react";
import { callAi } from "@/lib/api";
import { CATEGORIES } from "@/lib/types";
import type { MarketAnalysis } from "@/lib/types";
import { PageHeader, Spinner, ErrorBanner, ScoreBar } from "@/components/ui";

export default function MarketAnalysisPage() {
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [result, setResult] = useState<MarketAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await callAi<MarketAnalysis>(
        "/api/ai/market-analysis",
        { category },
      );
      setResult(data);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Market Analysis"
        subtitle="Pick a category and get market size, growth, competition, and ranked niches."
      />

      <div className="card mb-6">
        <span className="label">Category</span>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`chip ${
                category === c ? "chip-active" : "hover:border-primary"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <button onClick={run} disabled={loading} className="btn-primary mt-4">
          {loading ? "Analyzing…" : "Analyze market"}
        </button>
      </div>

      {loading && <Spinner label="Analyzing market…" />}
      {error ? <ErrorBanner error={error} /> : null}

      {result && (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Market size" value={result.marketSize} />
            <Stat label="Growth" value={result.growth} />
            <Stat label="Competition" value={result.competition} />
          </div>

          <div className="card">
            <h3 className="font-semibold text-white">Summary</h3>
            <p className="mt-2 text-sm text-gray-400">{result.summary}</p>
          </div>

          <div>
            <h3 className="mb-3 font-semibold text-white">Ranked niches</h3>
            <div className="space-y-3">
              {[...result.niches]
                .sort((a, b) => b.score - a.score)
                .map((n) => (
                  <div key={n.name} className="card">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-white">{n.name}</h4>
                      <span className="chip">{n.score}/100</span>
                    </div>
                    <div className="mt-3">
                      <ScoreBar label="Opportunity" value={n.score} />
                    </div>
                    <p className="mt-3 text-sm text-gray-400">{n.rationale}</p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <div className="text-xs uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="mt-1 text-sm text-gray-200">{value}</div>
    </div>
  );
}
