"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { AppOpportunity, SavedItem, TopApp } from "@/lib/types";
import { getSavedItems, deleteSavedItem } from "@/lib/saved-store";
import { PageHeader, Spinner } from "@/components/ui";
import { AppAnalysisModal } from "@/components/AppAnalysisModal";

type AnalyzeTarget = { name: string; oneLiner: string; category: string };

export default function SavedPage() {
  const [items, setItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyze, setAnalyze] = useState<AnalyzeTarget | null>(null);

  useEffect(() => {
    getSavedItems()
      .then(setItems)
      .catch(() => {
        /* non-fatal */
      })
      .finally(() => setLoading(false));
  }, []);

  async function remove(id: string) {
    const snapshot = items;
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await deleteSavedItem(id);
    } catch {
      setItems(snapshot);
    }
  }

  const topApps = items.filter((i) => i.kind === "top_app");
  const opps = items.filter((i) => i.kind === "opportunity");

  return (
    <div>
      <PageHeader
        title="Saved"
        subtitle="Apps and opportunities you bookmarked to revisit."
      />

      {loading ? (
        <Spinner label="Loading saved items…" />
      ) : items.length === 0 ? (
        <div className="card text-sm text-gray-400">
          Nothing saved yet. Click <span className="text-gray-200">☆ Save</span>{" "}
          on any app in <Link href="/dashboard/top-apps" className="text-primary hover:underline">Top 100 Apps</Link>{" "}
          or <Link href="/dashboard/opportunities" className="text-primary hover:underline">Opportunities</Link> to keep it here.
        </div>
      ) : (
        <div className="space-y-8">
          {opps.length > 0 && (
            <section>
              <h2 className="mb-3 font-semibold text-white">
                Opportunities ({opps.length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {opps.map((item) => {
                  const op = item.payload as AppOpportunity;
                  return (
                    <div key={item.id} className="card flex flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-white">{op.idea}</h3>
                        <span className="chip shrink-0">
                          {op.opportunityScore}/100
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-400">{op.pitch}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={() =>
                            setAnalyze({
                              name: op.idea,
                              oneLiner: op.pitch,
                              category: op.category,
                            })
                          }
                          className="chip hover:border-primary"
                        >
                          Analyze
                        </button>
                        <Link
                          href={`/dashboard/build?idea=${encodeURIComponent(
                            op.idea,
                          )}&desc=${encodeURIComponent(op.pitch)}`}
                          className="chip hover:border-primary"
                        >
                          Build →
                        </Link>
                        <button
                          onClick={() => remove(item.id)}
                          className="chip ml-auto hover:border-red-400 hover:text-red-400"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {topApps.length > 0 && (
            <section>
              <h2 className="mb-3 font-semibold text-white">
                Top Apps ({topApps.length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {topApps.map((item) => {
                  const app = item.payload as TopApp;
                  return (
                    <div key={item.id} className="card flex flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-white">{app.name}</h3>
                        <span className="chip shrink-0">
                          {app.estMonthlyRevenue}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-400">
                        {app.oneLiner}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={() =>
                            setAnalyze({
                              name: app.name,
                              oneLiner: app.oneLiner,
                              category: app.category,
                            })
                          }
                          className="chip hover:border-primary"
                        >
                          Analyze
                        </button>
                        <Link
                          href={`/dashboard/build?ref=${encodeURIComponent(
                            app.name,
                          )}&desc=${encodeURIComponent(app.oneLiner)}`}
                          className="chip hover:border-primary"
                        >
                          Build →
                        </Link>
                        <button
                          onClick={() => remove(item.id)}
                          className="chip ml-auto hover:border-red-400 hover:text-red-400"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}

      {analyze && (
        <AppAnalysisModal
          name={analyze.name}
          oneLiner={analyze.oneLiner}
          category={analyze.category}
          onClose={() => setAnalyze(null)}
        />
      )}
    </div>
  );
}
