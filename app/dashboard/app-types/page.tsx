"use client";

import { useState } from "react";
import Link from "next/link";
import { callAi } from "@/lib/api";
import type { AppOpportunity } from "@/lib/types";
import { PageHeader, Spinner, ErrorBanner } from "@/components/ui";
import { AppAnalysisModal } from "@/components/AppAnalysisModal";
import { OpportunityCard } from "@/components/OpportunityCard";
import { useSaved } from "@/lib/use-saved";

const PER_CLICK = 50;

type AppType = { name: string; desc: string };

const APP_TYPES: AppType[] = [
  { name: "Habit Tracker", desc: "Build daily habits with streaks and reminders." },
  { name: "Health & Fitness Tracker", desc: "Log workouts, nutrition, and health metrics." },
  { name: "Hobby Guide", desc: "Learn and progress in a hobby with guides and tips." },
  { name: "Professional Reference Tool", desc: "Quick reference and tools for a profession." },
  { name: "Budget & Finance Tracker", desc: "Track spending, budgets, and savings goals." },
  { name: "Meal Planner", desc: "Plan meals, recipes, and grocery lists." },
  { name: "Journaling & Diary", desc: "Daily journaling, prompts, and reflection." },
  { name: "Meditation & Mindfulness", desc: "Guided meditation and calming routines." },
  { name: "Language Learning", desc: "Learn a language with lessons and practice." },
  { name: "To-do & Productivity", desc: "Tasks, lists, and focus tools." },
  { name: "Local Discovery", desc: "Find places, events, and things to do nearby." },
  { name: "Education & Courses", desc: "Bite-size lessons and course content." },
  { name: "Kids & Family", desc: "Safe, fun, educational apps for kids and parents." },
  { name: "Marketplace", desc: "Buy, sell, or rent within a niche community." },
  { name: "Social & Community", desc: "Connect people around a shared interest." },
  { name: "Scanner & Utility", desc: "Scan, convert, or automate a small task." },
];

export default function AppTypesPage() {
  const [type, setType] = useState<AppType | null>(null);
  const [ideas, setIdeas] = useState<AppOpportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [exhausted, setExhausted] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [selected, setSelected] = useState<AppOpportunity | null>(null);
  const saved = useSaved("opportunity");

  function pick(t: AppType) {
    setType(t);
    setIdeas([]);
    setExhausted(false);
    setError(null);
    void fetchMore(true, t);
  }

  function back() {
    setType(null);
    setIdeas([]);
    setError(null);
  }

  async function fetchMore(reset: boolean, t: AppType | null = type) {
    if (!t || loading || loadingMore) return;
    reset ? setLoading(true) : setLoadingMore(true);
    setError(null);

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
          { appType: t.name, count: 12, exclude: collected.map((o) => o.idea) },
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

  // ── Type picker (landing) ──
  if (!type) {
    return (
      <div>
        <PageHeader
          title="App Types"
          subtitle="Pick the kind of app you want to build — we'll suggest specific, scored ideas of that type."
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {APP_TYPES.map((t) => (
            <button
              key={t.name}
              onClick={() => pick(t)}
              className="card text-left hover:border-primary"
            >
              <h3 className="font-semibold text-white">{t.name}</h3>
              <p className="mt-1 text-sm text-gray-400">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Ideas for the chosen type ──
  return (
    <div>
      <PageHeader title={type.name} subtitle={type.desc} />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button onClick={back} className="btn-ghost text-sm">
          ← All types
        </button>
        <Link
          href={`/dashboard/build?idea=${encodeURIComponent(
            type.name,
          )}&desc=${encodeURIComponent(type.desc)}`}
          className="btn-primary text-sm"
        >
          Plan a {type.name} from scratch →
        </Link>
      </div>

      {(loading || loadingMore) && (
        <Spinner
          label={
            ideas.length ? `Found ${ideas.length}… finding more` : "Finding ideas…"
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
              That&apos;s all the strong {type.name} ideas we found.
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
