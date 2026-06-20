"use client";

import { useEffect, useState } from "react";
import { callAi } from "@/lib/api";
import { CATEGORIES } from "@/lib/types";
import type { MarketAnalysis, SavedMarketAnalysis } from "@/lib/types";
import {
  getMarketAnalyses,
  saveMarketAnalysis,
  deleteMarketAnalysis,
} from "@/lib/market-store";
import { isSupabaseConfigured } from "@/lib/env";
import { PageHeader, Spinner, ErrorBanner, ScoreBar } from "@/components/ui";

export default function MarketAnalysisPage() {
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [result, setResult] = useState<MarketAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const [history, setHistory] = useState<SavedMarketAnalysis[]>([]);
  const synced = isSupabaseConfigured();

  useEffect(() => {
    getMarketAnalyses()
      .then(setHistory)
      .catch(() => {
        /* non-fatal: history panel just stays empty */
      });
  }, []);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await callAi<MarketAnalysis>(
        "/api/ai/market-analysis",
        { category },
      );
      setResult(data);

      // Auto-save to history. Non-fatal: a save hiccup must not hide the result.
      try {
        const saved = await saveMarketAnalysis({ category, analysis: data });
        setHistory((prev) => [saved, ...prev]);
      } catch {
        /* ignore — the analysis still displays */
      }
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  function loadFromHistory(entry: SavedMarketAnalysis) {
    setCategory(entry.category);
    setResult(entry.analysis);
    setError(null);
  }

  async function removeFromHistory(id: string) {
    const snapshot = history;
    setHistory((prev) => prev.filter((m) => m.id !== id));
    try {
      await deleteMarketAnalysis(id);
    } catch (e) {
      setError(e);
      setHistory(snapshot);
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

      {history.length > 0 && (
        <div className="card mb-6">
          <h2 className="mb-3 text-sm font-semibold text-white">History</h2>
          <div className="space-y-2">
            {history.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2"
              >
                <button
                  onClick={() => loadFromHistory(m)}
                  className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
                  title="Open this analysis"
                >
                  <span className="truncate text-sm font-medium text-gray-200 hover:text-primary">
                    {m.category}
                  </span>
                  <span className="shrink-0 text-xs text-gray-500">
                    {new Date(m.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </button>
                <button
                  onClick={() => removeFromHistory(m.id)}
                  className="shrink-0 text-xs text-gray-500 hover:text-red-400"
                  aria-label="Delete saved analysis"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-500">
            {synced
              ? "Saved to your account — revisit any analysis anytime."
              : "Saved in your browser (connect Supabase to sync across devices)."}
          </p>
        </div>
      )}

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
