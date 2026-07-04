"use client";

import { useEffect, useState } from "react";
import { BRAIN_CATEGORIES } from "@/lib/types";
import type { BrainFact } from "@/lib/types";
import {
  getBrainFacts,
  addBrainFact,
  addBrainFacts,
  updateBrainFact,
  deleteBrainFact,
} from "@/lib/brain-store";
import { PageHeader, Spinner } from "@/components/ui";

const PROMPTS: Record<string, string> = {
  Business: "What does your business do, in a sentence or two?",
  "Offer & Products": "What do you sell? Products, services, price points.",
  Audience: "Who is your ideal customer — their pains and desires?",
  "Brand Voice": "How should your content sound? Tone, style, words to use/avoid.",
  Story: "Your origin story and why you do this.",
  Goals: "What are you working toward — revenue, launches, milestones?",
  Competitors: "Who else is in your space, and how are you different?",
  Other: "Anything else the AI should always know about you.",
};

export default function BrainPage() {
  const [facts, setFacts] = useState<BrainFact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [category, setCategory] = useState<string>(BRAIN_CATEGORIES[0]);
  const [content, setContent] = useState("");
  const [adding, setAdding] = useState(false);
  const [bulk, setBulk] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    getBrainFacts()
      .then(setFacts)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load."))
      .finally(() => setLoading(false));
  }, []);

  // In bulk mode, each non-empty line becomes its own fact.
  const bulkLines = content
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  async function add() {
    if (adding) return;

    if (bulk) {
      if (!bulkLines.length) return;
      setAdding(true);
      setError(null);
      try {
        const added = await addBrainFacts(category, bulkLines);
        setFacts((prev) => [...prev, ...added]);
        setContent("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to add.");
      } finally {
        setAdding(false);
      }
      return;
    }

    const text = content.trim();
    if (!text) return;
    setAdding(true);
    setError(null);
    try {
      const fact = await addBrainFact({ category, content: text });
      setFacts((prev) => [...prev, fact]);
      setContent("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add.");
    } finally {
      setAdding(false);
    }
  }

  function startEdit(f: BrainFact) {
    setEditingId(f.id);
    setEditContent(f.content);
  }

  async function saveEdit(id: string) {
    const text = editContent.trim();
    if (!text) return;
    try {
      const updated = await updateBrainFact(id, { content: text });
      setFacts((prev) => prev.map((f) => (f.id === id ? updated : f)));
      setEditingId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save.");
    }
  }

  async function remove(id: string) {
    const snapshot = facts;
    setFacts((prev) => prev.filter((f) => f.id !== id));
    if (editingId === id) setEditingId(null);
    try {
      await deleteBrainFact(id);
    } catch {
      setFacts(snapshot);
    }
  }

  return (
    <div>
      <PageHeader
        title="Brain"
        subtitle="Everything the AI should know about you and your business. Every marketing tool starts from what's here."
      />

      {/* Add a fact */}
      <div className="card mb-6 space-y-3">
        {/* Mode toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setBulk(false)}
            className={`chip ${!bulk ? "chip-active" : "hover:border-primary"}`}
          >
            Add one
          </button>
          <button
            onClick={() => setBulk(true)}
            className={`chip ${bulk ? "chip-active" : "hover:border-primary"}`}
          >
            Paste many
          </button>
        </div>

        <span className="label">Category</span>
        <div className="flex flex-wrap gap-2">
          {BRAIN_CATEGORIES.map((c) => (
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
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            bulk
              ? "Paste your facts here — one per line. Each line becomes its own fact under the category above."
              : PROMPTS[category] ?? "Add a fact…"
          }
          rows={bulk ? 8 : 3}
          className="input resize-none"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {bulk
              ? `Each line becomes one fact under ${category}. ${
                  bulkLines.length
                    ? `${bulkLines.length} ${
                        bulkLines.length === 1 ? "fact" : "facts"
                      } ready.`
                    : ""
                }`
              : "Tip: add several short, specific facts rather than one long note."}
          </span>
          <button
            onClick={add}
            disabled={
              adding || (bulk ? bulkLines.length === 0 : !content.trim())
            }
            className="btn-primary disabled:opacity-60"
          >
            {adding
              ? "Adding…"
              : bulk
                ? `Add ${bulkLines.length || ""} ${
                    bulkLines.length === 1 ? "fact" : "facts"
                  }`.replace(/\s+/g, " ").trim()
                : "Add to Brain"}
          </button>
        </div>
      </div>

      {error && (
        <div className="card mb-6 border-red-500/40 bg-red-500/10 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Facts grouped by category */}
      {loading ? (
        <Spinner label="Loading your Brain…" />
      ) : facts.length === 0 ? (
        <div className="card text-sm text-gray-400">
          Your Brain is empty. Add a few facts above — start with{" "}
          <span className="text-gray-200">Business</span>,{" "}
          <span className="text-gray-200">Audience</span>, and{" "}
          <span className="text-gray-200">Offer &amp; Products</span>. The more
          it knows, the better every tool&apos;s output.
        </div>
      ) : (
        <div className="space-y-6">
          {BRAIN_CATEGORIES.filter((c) =>
            facts.some((f) => f.category === c),
          ).map((c) => (
            <section key={c}>
              <h2 className="mb-2 text-sm font-semibold text-white">{c}</h2>
              <div className="space-y-2">
                {facts
                  .filter((f) => f.category === c)
                  .map((f) => (
                    <div key={f.id} className="card">
                      {editingId === f.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={3}
                            className="input resize-none"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveEdit(f.id)}
                              className="chip chip-active"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="chip hover:border-primary"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <p className="whitespace-pre-wrap text-sm text-gray-200">
                            {f.content}
                          </p>
                          <div className="flex shrink-0 gap-2">
                            <button
                              onClick={() => startEdit(f)}
                              className="text-xs text-gray-500 hover:text-white"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => remove(f.id)}
                              className="text-xs text-gray-500 hover:text-red-400"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
