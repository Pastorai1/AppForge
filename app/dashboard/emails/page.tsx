"use client";

import { useEffect, useRef, useState } from "react";
import { callAi } from "@/lib/api";
import type {
  AttractiveCharacter,
  EmailSequenceType,
  GeneratedEmail,
  SavedEmailSequence,
} from "@/lib/types";
import { EMAIL_SEQUENCE_SPECS, getSequenceSpec } from "@/lib/email-sequences";
import { getCharacters, formatCharacterVoice } from "@/lib/characters-store";
import { getBrainFacts, formatBrainContext } from "@/lib/brain-store";
import {
  getEmailSequences,
  createEmailSequence,
  deleteEmailSequence,
} from "@/lib/email-sequences-store";
import { PageHeader, ErrorBanner } from "@/components/ui";

export default function EmailsPage() {
  const [type, setType] = useState<EmailSequenceType>("welcome");
  const [characters, setCharacters] = useState<AttractiveCharacter[]>([]);
  const [characterId, setCharacterId] = useState<string>("");
  const [topic, setTopic] = useState("");

  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number; label: string } | null>(
    null,
  );
  const [emails, setEmails] = useState<GeneratedEmail[]>([]);
  const [resultLabel, setResultLabel] = useState("");
  const [history, setHistory] = useState<SavedEmailSequence[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [copied, setCopied] = useState<number | null>(null);

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
      setHistory(await getEmailSequences());
    } catch {
      /* non-fatal */
    }
  }

  async function generate() {
    if (generating) return;
    setGenerating(true);
    setError(null);
    setEmails([]);
    setCopied(null);

    const spec = getSequenceSpec(type);
    setResultLabel(spec.label);
    const character = characters.find((c) => c.id === characterId) ?? null;
    const characterVoice = character ? formatCharacterVoice(character) : "";
    const characterName = character ? character.name : "";

    try {
      const brainContext = await loadBrain();
      const collected: GeneratedEmail[] = [];
      const priorSubjects: string[] = [];

      for (let i = 0; i < spec.steps.length; i++) {
        const step = spec.steps[i];
        setProgress({ done: i, total: spec.steps.length, label: step.purpose });
        const { data } = await callAi<{ subject: string; body: string }>(
          "/api/ai/email",
          {
            topic: topic.trim(),
            sequenceLabel: spec.label,
            stepPurpose: step.purpose,
            stepInstruction: step.instruction,
            position: i + 1,
            total: spec.steps.length,
            brainContext,
            characterVoice,
            priorSubjects,
          },
        );
        const email: GeneratedEmail = {
          purpose: step.purpose,
          subject: data.subject,
          body: data.body,
        };
        collected.push(email);
        priorSubjects.push(data.subject);
        setEmails([...collected]);
      }

      setProgress(null);

      // Save to history.
      try {
        const saved = await createEmailSequence({
          type,
          label: spec.label,
          topic: topic.trim(),
          characterName,
          emails: collected,
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

  function view(seq: SavedEmailSequence) {
    setType(seq.type);
    setResultLabel(seq.label);
    setEmails(seq.emails);
    setTopic(seq.topic);
    setCopied(null);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function removeHistory(id: string) {
    const snapshot = history;
    setHistory((prev) => prev.filter((s) => s.id !== id));
    try {
      await deleteEmailSequence(id);
    } catch {
      setHistory(snapshot);
    }
  }

  async function copyEmail(i: number, e: GeneratedEmail) {
    try {
      await navigator.clipboard.writeText(`Subject: ${e.subject}\n\n${e.body}`);
      setCopied(i);
      setTimeout(() => setCopied((c) => (c === i ? null : c)), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div>
      <PageHeader
        title="One-to-Many Emails"
        subtitle="Generate a full email sequence in one of your brand voices, grounded in your Brain. Save it and copy each email."
      />

      {error ? (
        <div className="mb-4">
          <ErrorBanner error={error} />
        </div>
      ) : null}

      {/* Controls */}
      <div className="card mb-6 space-y-4">
        <div>
          <span className="label">Sequence type</span>
          <div className="mt-1 flex flex-wrap gap-2">
            {EMAIL_SEQUENCE_SPECS.map((s) => (
              <button
                key={s.type}
                onClick={() => setType(s.type)}
                className={`chip ${
                  type === s.type ? "chip-active" : "hover:border-primary"
                }`}
                title={s.description}
              >
                {s.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {getSequenceSpec(type).description}{" "}
            {getSequenceSpec(type).steps.length} emails.
          </p>
        </div>

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
            {characters.length === 0 && (
              <p className="mt-1 text-xs text-gray-500">
                Tip: create a voice on the Attractive Character page for on-brand
                emails.
              </p>
            )}
          </div>
        </div>

        <div>
          <span className="label">What&apos;s this sequence promoting / about?</span>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. PastorAI's 14-day free trial for busy pastors — help them reclaim time for ministry."
            rows={3}
            className="input resize-none"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {generating && progress
              ? `Writing email ${progress.done + 1} of ${progress.total} — ${progress.label}…`
              : "Emails are written one at a time for reliability."}
          </span>
          <button
            onClick={generate}
            disabled={generating}
            className="btn-primary disabled:opacity-60"
          >
            {generating ? "Generating…" : "Generate sequence"}
          </button>
        </div>
      </div>

      {/* Result */}
      {emails.length > 0 && (
        <div className="mb-8 space-y-4">
          <h2 className="text-sm font-semibold text-white">
            {resultLabel} — {emails.length} emails
          </h2>
          {emails.map((e, i) => (
            <div key={i} className="card space-y-2">
              <div className="flex items-start justify-between gap-3">
                <span className="chip chip-active shrink-0">
                  {i + 1}. {e.purpose}
                </span>
                <button
                  onClick={() => copyEmail(i, e)}
                  className="shrink-0 text-xs text-gray-400 hover:text-white"
                >
                  {copied === i ? "Copied ✓" : "Copy"}
                </button>
              </div>
              <p className="text-sm font-semibold text-white break-words">
                Subject: {e.subject}
              </p>
              <p className="whitespace-pre-wrap break-words text-sm text-gray-200">
                {e.body}
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
            {history.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2"
              >
                <button
                  onClick={() => view(s)}
                  className="min-w-0 flex-1 text-left text-sm text-gray-200 hover:text-primary"
                >
                  <span className="font-medium">{s.label}</span>
                  {s.characterName ? (
                    <span className="text-gray-500"> · {s.characterName}</span>
                  ) : null}
                  {s.topic ? (
                    <span className="block truncate text-xs text-gray-500">
                      {s.topic}
                    </span>
                  ) : null}
                </button>
                <button
                  onClick={() => removeHistory(s.id)}
                  className="shrink-0 text-xs text-gray-500 hover:text-red-400"
                  aria-label="Delete sequence"
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
