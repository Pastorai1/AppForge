"use client";

import { useState } from "react";
import { callAi } from "@/lib/api";
import { CATEGORIES } from "@/lib/types";
import type { AppOpportunity } from "@/lib/types";
import { PageHeader, Spinner, ErrorBanner } from "@/components/ui";
import { AppAnalysisModal } from "@/components/AppAnalysisModal";
import { OpportunityCard } from "@/components/OpportunityCard";
import { useSaved } from "@/lib/use-saved";

const PER_CLICK = 50; // ideas added per "Find" / "load more"

export default function OpportunitiesPage() {
  const [category, setCategory] = useState("All");
  const [ideas, setIdeas] = useState<AppOpportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [exhausted, setExhausted] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [selected, setSelected] = useState<AppOpportunity | null>(null);
  const saved = useSaved("opportunity");

  /**
   * Add up to PER_CLICK new ideas via fast 12-item sub-batches so no single
   * request times out. `reset` starts a fresh list.
   */
  async function fetchMore(reset: boolean) {
    if (loading || loadingMore) return;
    reset ? setLoading(true) : setLoadingMore(true);
    setError(null);
    if (reset) {
      setIdeas([]);
      setExhausted(false);
    }

    const collected: AppOpportunity[] = reset ? [] : [...ideas];
    const seen = new Set(collected.map((o) => o.idea.trim().toLowerCase()));
    const startCount = collected.length;
    let ranOut = false;

    try {
      for (
        let req = 0;
        collected.length - startCount < PER_CLICK && req < 5;
        req++
      ) {
        const { data } = await callAi<AppOpportunity[]>(
          "/api/ai/opportunities",
          { category, count: 12, exclude: collected.map((o) => o.idea) },
        );

        let added = 0;
        for (const op of data) {
          const key = op.idea.trim().toLowerCase();
          if (key && !seen.has(key)) {
            seen.add(key);
            collected.push(op);
            added++;
          }
        }
        setIdeas([...collected]);
        if (added === 0) {
          ranOut = true;
          break;
        }
      }
    } catch (e) {
      if (collected.length === startCount) setError(e);
    } finally {
      setExhausted(ranOut);
      reset ? setLoading(false) : setLoadingMore(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Opportunities"
        subtitle="AI-recommended apps to build — ranked by market fit and beatable competition."
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
        <button
          onClick={() => fetchMore(true)}
          disabled={loading || loadingMore}
          className="btn-primary"
        >
          {loading ? "Finding…" : "Find opportunities"}
        </button>
      </div>

      {(loading || loadingMore) && (
        <Spinner
          label={
            ideas.length ? `Found ${ideas.length}… finding more` : "Finding…"
          }
        />
      )}
      {!loading && !loadingMore && ideas.length > 0 && (
        <p className="mb-3 text-xs text-gray-500">{ideas.length} ideas</p>
      )}
      {error ? <ErrorBanner error={error} /> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ideas.map((op, i) => (
          <OpportunityCard
            key={`${op.idea}-${i}`}
            op={op}
            saved={saved.isSaved(op.idea)}
            busy={saved.isBusy(op.idea)}
            onToggleSave={() => saved.toggle(op.idea, op)}
            onAnalyze={() => setSelected(op)}
          />
        ))}
      </div>

      {ideas.length > 0 && !loading && (
        <div className="mt-6 flex flex-col items-center gap-2">
          {exhausted ? (
            <p className="text-xs text-gray-500">
              That&apos;s all the strong opportunities we found for this filter.
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
          name={selected.idea}
          oneLiner={selected.pitch}
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
