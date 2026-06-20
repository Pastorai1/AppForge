"use client";

import { useState } from "react";
import Link from "next/link";
import { callAi } from "@/lib/api";
import { CATEGORIES, MONETIZATIONS } from "@/lib/types";
import type { TopApp, AppAnalysis } from "@/lib/types";
import { PageHeader, Spinner, ErrorBanner } from "@/components/ui";

export default function TopAppsPage() {
  const [category, setCategory] = useState("All");
  const [monetization, setMonetization] = useState("All");
  const [apps, setApps] = useState<TopApp[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [selected, setSelected] = useState<TopApp | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await callAi<TopApp[]>("/api/ai/top-apps", {
        category,
        monetization,
      });
      setApps(data);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Top 100 Apps Explorer"
        subtitle="AI-ranked top-grossing apps. Filter, then click one for a deep dive."
      />

      <div className="card mb-6 space-y-4">
        <div>
          <span className="label">Category</span>
          <div className="flex flex-wrap gap-2">
            <Chip
              active={category === "All"}
              onClick={() => setCategory("All")}
              label="All"
            />
            {CATEGORIES.map((c) => (
              <Chip
                key={c}
                active={category === c}
                onClick={() => setCategory(c)}
                label={c}
              />
            ))}
          </div>
        </div>
        <div>
          <span className="label">Monetization</span>
          <div className="flex flex-wrap gap-2">
            <Chip
              active={monetization === "All"}
              onClick={() => setMonetization("All")}
              label="All"
            />
            {MONETIZATIONS.map((m) => (
              <Chip
                key={m}
                active={monetization === m}
                onClick={() => setMonetization(m)}
                label={m}
              />
            ))}
          </div>
        </div>
        <button onClick={load} disabled={loading} className="btn-primary">
          {loading ? "Generating…" : "Generate list"}
        </button>
      </div>

      {loading && <Spinner />}
      {error ? <ErrorBanner error={error} /> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {apps.map((app, i) => (
          <div key={`${app.name}-${i}`} className="card flex flex-col">
            <button
              onClick={() => setSelected(app)}
              className="text-left hover:opacity-90"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-white">{app.name}</h3>
                <span className="chip">{app.estMonthlyRevenue}</span>
              </div>
              <p className="mt-2 text-sm text-gray-400">{app.oneLiner}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="chip">{app.category}</span>
                <span className="chip">{app.monetization}</span>
              </div>
            </button>
            <Link
              href={`/dashboard/build?ref=${encodeURIComponent(
                app.name,
              )}&desc=${encodeURIComponent(app.oneLiner)}`}
              className="btn-ghost mt-3 text-center text-sm"
            >
              Build a better version →
            </Link>
          </div>
        ))}
      </div>

      {selected && (
        <AnalysisModal app={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`chip ${active ? "chip-active" : "hover:border-primary"}`}
    >
      {label}
    </button>
  );
}

function AnalysisModal({
  app,
  onClose,
}: {
  app: TopApp;
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
        name: app.name,
        oneLiner: app.oneLiner,
        category: app.category,
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
            <h2 className="text-xl font-bold text-white">{app.name}</h2>
            <p className="text-sm text-gray-400">{app.oneLiner}</p>
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
