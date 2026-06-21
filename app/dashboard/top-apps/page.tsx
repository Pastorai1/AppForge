"use client";

import { useState } from "react";
import Link from "next/link";
import { callAi } from "@/lib/api";
import { CATEGORIES, MONETIZATIONS } from "@/lib/types";
import type { TopApp } from "@/lib/types";
import { PageHeader, Spinner, ErrorBanner } from "@/components/ui";
import { AppAnalysisModal } from "@/components/AppAnalysisModal";

const PER_CLICK = 50; // apps added per "generate" / "load more"
// No hard cap — keep loading until the model runs out of distinct real apps.
const MAX_TOTAL = Infinity;

export default function TopAppsPage() {
  const [category, setCategory] = useState("All");
  const [monetization, setMonetization] = useState("All");
  const [apps, setApps] = useState<TopApp[]>([]);
  const [loading, setLoading] = useState(false); // initial generate
  const [loadingMore, setLoadingMore] = useState(false);
  const [exhausted, setExhausted] = useState(false); // model has no more to add
  const [error, setError] = useState<unknown>(null);
  const [selected, setSelected] = useState<TopApp | null>(null);

  /**
   * Add up to PER_CLICK new apps, fetched in fast 25-item sub-batches so no
   * single request is slow enough to time out. `reset` starts a fresh list.
   */
  async function fetchMore(reset: boolean) {
    if (loading || loadingMore) return;
    reset ? setLoading(true) : setLoadingMore(true);
    setError(null);
    if (reset) {
      setApps([]);
      setExhausted(false);
    }

    const collected: TopApp[] = reset ? [] : [...apps];
    const seen = new Set(collected.map((a) => a.name.trim().toLowerCase()));
    const startCount = collected.length;
    let ranOut = false;

    try {
      // Up to 3 requests per click to net ~50, then stop even if short.
      for (
        let req = 0;
        collected.length - startCount < PER_CLICK &&
        collected.length < MAX_TOTAL &&
        req < 3;
        req++
      ) {
        const { data } = await callAi<TopApp[]>("/api/ai/top-apps", {
          category,
          monetization,
          count: 25,
          exclude: collected.map((a) => a.name),
        });

        let added = 0;
        for (const app of data) {
          const key = app.name.trim().toLowerCase();
          if (key && !seen.has(key)) {
            seen.add(key);
            collected.push(app);
            added++;
          }
        }
        setApps([...collected]);
        if (added === 0) {
          ranOut = true;
          break;
        }
      }
    } catch (e) {
      // Keep what we have; only surface an error if this click added nothing.
      if (collected.length === startCount) setError(e);
    } finally {
      setExhausted(ranOut || collected.length >= MAX_TOTAL);
      reset ? setLoading(false) : setLoadingMore(false);
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
        <button
          onClick={() => fetchMore(true)}
          disabled={loading || loadingMore}
          className="btn-primary"
        >
          {loading ? "Generating…" : "Generate list"}
        </button>
      </div>

      {(loading || loadingMore) && (
        <Spinner
          label={
            apps.length
              ? `Loaded ${apps.length}… fetching more`
              : "Generating…"
          }
        />
      )}
      {!loading && !loadingMore && apps.length > 0 && (
        <p className="mb-3 text-xs text-gray-500">{apps.length} apps</p>
      )}
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

      {apps.length > 0 && !loading && (
        <div className="mt-6 flex flex-col items-center gap-2">
          {exhausted ? (
            <p className="text-xs text-gray-500">
              That&apos;s all the distinct apps we could find for this filter.
            </p>
          ) : (
            <button
              onClick={() => fetchMore(false)}
              disabled={loadingMore}
              className="btn-ghost"
            >
              {loadingMore ? "Loading…" : "Generate next 50"}
            </button>
          )}
        </div>
      )}

      {selected && (
        <AppAnalysisModal
          name={selected.name}
          oneLiner={selected.oneLiner}
          category={selected.category}
          onClose={() => setSelected(null)}
        />
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
