"use client";

import Link from "next/link";
import type { AppOpportunity } from "@/lib/types";
import { SaveButton } from "@/components/SaveButton";

/** A single scored app-idea card, used by Opportunities and App Types. */
export function OpportunityCard({
  op,
  saved,
  busy,
  onToggleSave,
  onAnalyze,
}: {
  op: AppOpportunity;
  saved: boolean;
  busy: boolean;
  onToggleSave: () => void;
  onAnalyze: () => void;
}) {
  return (
    <div className="card flex flex-col">
      <button onClick={onAnalyze} className="text-left hover:opacity-90">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-white">{op.idea}</h3>
          <span className="chip shrink-0">{op.opportunityScore}/100</span>
        </div>
        <p className="mt-2 text-sm text-gray-400">{op.pitch}</p>
        <div className="mt-3 space-y-1 text-xs text-gray-500">
          <p>
            <span className="text-gray-400">Market fit:</span> {op.why}
          </p>
          <p>
            <span className="text-gray-400">Competition:</span> {op.competition}
          </p>
          <p>
            <span className="text-gray-400">Monetization:</span>{" "}
            {op.monetization}
          </p>
        </div>
        <div className="mt-3">
          <span className="chip">{op.category}</span>
        </div>
      </button>
      <div className="mt-3 flex items-center gap-2">
        <SaveButton saved={saved} busy={busy} onClick={onToggleSave} />
        <Link
          href={`/dashboard/build?idea=${encodeURIComponent(
            op.idea,
          )}&desc=${encodeURIComponent(op.pitch)}`}
          className="btn-ghost flex-1 text-center text-sm"
        >
          Build this →
        </Link>
      </div>
    </div>
  );
}
