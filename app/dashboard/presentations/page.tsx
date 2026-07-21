"use client";

import { useEffect, useRef, useState } from "react";
import { callAi } from "@/lib/api";
import type {
  AttractiveCharacter,
  PresentationSection,
  SavedPresentation,
} from "@/lib/types";
import { PRESENTATION_SECTIONS } from "@/lib/presentation-sections";
import { getCharacters, formatCharacterVoice } from "@/lib/characters-store";
import { getBrainFacts, formatBrainContext } from "@/lib/brain-store";
import {
  getPresentations,
  createPresentation,
  deletePresentation,
} from "@/lib/presentations-store";
import { PageHeader, ErrorBanner } from "@/components/ui";

export default function PresentationsPage() {
  const [characters, setCharacters] = useState<AttractiveCharacter[]>([]);
  const [characterId, setCharacterId] = useState<string>("");
  const [topic, setTopic] = useState("");

  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [sections, setSections] = useState<PresentationSection[]>([]);
  const [history, setHistory] = useState<SavedPresentation[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const brainRef = useRef<string>("");
  const brainLoadedRef = useRef(false);

  useEffect(() => {
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadBrain() {
    if (brainLoadedRef.current) return brainRef.current;
    try {
      brainRef.current = formatBrainContext(await getBrainFacts());
    } catch {
      brainRef.current = "";
    }
    brainLoadedRef.current = true;
    return brainRef.current;
  }

  async function init() {
    void loadBrain();
    try {
      setCharacters(await getCharacters());
    } catch {
      /* non-fatal */
    }
    try {
      setHistory(await getPresentations());
    } catch {
      /* non-fatal */
    }
  }

  async function generate() {
    if (generating) return;
    setGenerating(true);
    setError(null);
    setSections([]);
    setCopied(null);

    const character = characters.find((c) => c.id === characterId) ?? null;
    const characterVoice = character ? formatCharacterVoice(character) : "";
    const characterName = character ? character.name : "";

    try {
      const brainContext = await loadBrain();
      const collected: PresentationSection[] = [];
      const specs = PRESENTATION_SECTIONS;

      for (let i = 0; i < specs.length; i++) {
        const spec = specs[i];
        setProgress(spec.title);

        // Running summary of prior sections keeps the script coherent.
        const priorContext = collected
          .map((s) => `${s.title}: ${s.content.slice(0, 280)}`)
          .join("\n\n");

        const { data } = await callAi<{ content: string }>(
          "/api/ai/presentation",
          {
            sectionTitle: spec.title,
            sectionInstruction: spec.instruction,
            position: i + 1,
            total: specs.length,
            topic: topic.trim(),
            priorContext,
            brainContext,
            characterVoice,
          },
        );
        collected.push({
          key: spec.key,
          title: spec.title,
          content: data.content,
        });
        setSections([...collected]);
      }

      setProgress(null);

      try {
        const saved = await createPresentation({
          topic: topic.trim(),
          characterName,
          sections: collected,
        });
        setHistory((prev) => [saved, ...prev]);
      } catch {
        /* keep on-screen result even if saving hiccups */
      }
    } catch (e) {
      setError(e);
      setProgress(null);
    } finally {
      setGenerating(false);
    }
  }

  function viewHistory(p: SavedPresentation) {
    setSections(p.sections);
    setTopic(p.topic);
    setCopied(null);
    if (typeof window !== "undefined")
      window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function removeHistory(id: string) {
    const snapshot = history;
    setHistory((prev) => prev.filter((s) => s.id !== id));
    try {
      await deletePresentation(id);
    } catch {
      setHistory(snapshot);
    }
  }

  async function copyText(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied((c) => (c === id ? null : c)), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  const fullScript = sections
    .map((s) => `${s.title}\n\n${s.content}`)
    .join("\n\n\n");

  return (
    <div>
      <PageHeader
        title="One-to-Many Presentations"
        subtitle="Generate a full Perfect Webinar-style sales presentation from your offer, in your brand voice and grounded in your Brain."
      />

      {error ? (
        <div className="mb-4">
          <ErrorBanner error={error} />
        </div>
      ) : null}

      {/* Controls */}
      <div className="card mb-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <span className="label">Voice (Attractive Character)</span>
            <select
              value={characterId}
              onChange={(e) => setCharacterId(e.target.value)}
              className="input"
            >
              <option value="">No specific voice (honest default)</option>
              {characters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <span className="label">
            What are you selling, and the transformation it delivers?
          </span>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. PastorAI — an AI ministry assistant. The transformation: pastors go from buried in prep work to having real time back for people and ministry."
            rows={3}
            className="input resize-none"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {generating && progress
              ? `Writing: ${progress}…`
              : `${PRESENTATION_SECTIONS.length}-section Perfect Webinar. Written one section at a time.`}
          </span>
          <button
            onClick={generate}
            disabled={generating}
            className="btn-primary disabled:opacity-60"
          >
            {generating ? "Generating…" : "Generate presentation"}
          </button>
        </div>
      </div>

      {/* Result */}
      {sections.length > 0 && (
        <div className="mb-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">
              Presentation script
            </h2>
            <button
              onClick={() => copyText("full", fullScript)}
              className="text-xs text-gray-400 hover:text-white"
            >
              {copied === "full" ? "Copied ✓" : "Copy full script"}
            </button>
          </div>
          {sections.map((s, i) => (
            <div key={s.key} className="card space-y-2">
              <div className="flex items-start justify-between gap-3">
                <span className="chip chip-active shrink-0">
                  {i + 1}. {s.title}
                </span>
                <button
                  onClick={() => copyText(s.key, `${s.title}\n\n${s.content}`)}
                  className="shrink-0 text-xs text-gray-400 hover:text-white"
                >
                  {copied === s.key ? "Copied ✓" : "Copy"}
                </button>
              </div>
              <p className="whitespace-pre-wrap text-sm text-gray-200">
                {s.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-white">History</h2>
          <div className="space-y-2">
            {history.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2"
              >
                <button
                  onClick={() => viewHistory(p)}
                  className="min-w-0 flex-1 text-left text-sm text-gray-200 hover:text-primary"
                >
                  <span className="font-medium">
                    {p.topic ? p.topic.slice(0, 60) : "Presentation"}
                  </span>
                  {p.characterName ? (
                    <span className="block truncate text-xs text-gray-500">
                      {p.characterName}
                    </span>
                  ) : null}
                </button>
                <button
                  onClick={() => removeHistory(p.id)}
                  className="shrink-0 text-xs text-gray-500 hover:text-red-400"
                  aria-label="Delete presentation"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
