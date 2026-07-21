"use client";

import { useEffect, useRef, useState } from "react";
import { callAi } from "@/lib/api";
import type { AttractiveCharacter, CharacterProfile } from "@/lib/types";
import {
  getCharacters,
  createCharacter,
  updateCharacter,
  deleteCharacter,
} from "@/lib/characters-store";
import { getBrainFacts, formatBrainContext } from "@/lib/brain-store";
import { PageHeader, ErrorBanner, Spinner } from "@/components/ui";

const FIELDS: {
  key: keyof CharacterProfile;
  label: string;
  placeholder: string;
  rows: number;
}[] = [
  {
    key: "identity",
    label: "Identity",
    placeholder: "Who is this character, and the role they embody for the audience?",
    rows: 3,
  },
  {
    key: "backstory",
    label: "Backstory",
    placeholder: "Their origin story and why they do this work.",
    rows: 4,
  },
  {
    key: "voice",
    label: "Voice & tone",
    placeholder: "How the writing should sound — tone, style, rhythm.",
    rows: 3,
  },
  {
    key: "audience",
    label: "Audience",
    placeholder: "Who they speak to, and in what language.",
    rows: 2,
  },
  {
    key: "signaturePhrases",
    label: "Signature phrases",
    placeholder: "Words, phrases, or hooks to lean on (comma-separated).",
    rows: 2,
  },
  {
    key: "avoid",
    label: "Avoid",
    placeholder: "Words, claims, or tactics to avoid (comma-separated).",
    rows: 2,
  },
];

const EMPTY_PROFILE: CharacterProfile = {
  identity: "",
  backstory: "",
  voice: "",
  audience: "",
  signaturePhrases: "",
  avoid: "",
};

export default function CharacterPage() {
  const [characters, setCharacters] = useState<AttractiveCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [profile, setProfile] = useState<CharacterProfile>(EMPTY_PROFILE);
  const [saving, setSaving] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const brainRef = useRef<string>("");
  const brainLoadedRef = useRef(false);

  useEffect(() => {
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadBrain() {
    if (brainLoadedRef.current) return brainRef.current;
    try {
      const facts = await getBrainFacts();
      brainRef.current = formatBrainContext(facts);
    } catch {
      brainRef.current = "";
    }
    brainLoadedRef.current = true;
    return brainRef.current;
  }

  async function init() {
    void loadBrain();
    try {
      const list = await getCharacters();
      setCharacters(list);
      if (list.length) select(list[0]);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  function select(c: AttractiveCharacter) {
    setActiveId(c.id);
    setName(c.name);
    setProfile({
      identity: c.identity,
      backstory: c.backstory,
      voice: c.voice,
      audience: c.audience,
      signaturePhrases: c.signaturePhrases,
      avoid: c.avoid,
    });
    setError(null);
  }

  async function newCharacter() {
    setError(null);
    setSaving(true);
    try {
      const c = await createCharacter({ name: "New character" });
      setCharacters((prev) => [c, ...prev]);
      select(c);
    } catch (e) {
      setError(e);
    } finally {
      setSaving(false);
    }
  }

  async function save() {
    if (!activeId || saving) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateCharacter(activeId, { name, ...profile });
      setCharacters((prev) =>
        prev.map((c) => (c.id === activeId ? updated : c)),
      );
    } catch (e) {
      setError(e);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    const snapshot = characters;
    const next = characters.filter((c) => c.id !== id);
    setCharacters(next);
    if (activeId === id) {
      if (next.length) select(next[0]);
      else {
        setActiveId(null);
        setName("");
        setProfile(EMPTY_PROFILE);
      }
    }
    try {
      await deleteCharacter(id);
    } catch {
      setCharacters(snapshot);
    }
  }

  async function draftFromBrain() {
    if (drafting) return;
    setDrafting(true);
    setError(null);
    try {
      const brainContext = await loadBrain();
      const { data } = await callAi<CharacterProfile>("/api/ai/character", {
        brainContext,
        seed: name && name !== "New character" ? name : "",
      });
      setProfile({
        identity: data.identity ?? "",
        backstory: data.backstory ?? "",
        voice: data.voice ?? "",
        audience: data.audience ?? "",
        signaturePhrases: data.signaturePhrases ?? "",
        avoid: data.avoid ?? "",
      });
    } catch (e) {
      setError(e);
    } finally {
      setDrafting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Attractive Character"
        subtitle="Build reusable brand-voice profiles. Your one-to-many content tools (emails, social, ads) will write in the voice you choose."
      />

      {error ? (
        <div className="mb-4">
          <ErrorBanner error={error} />
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-[240px_1fr]">
        {/* Character list */}
        <div className="space-y-3">
          <button
            onClick={newCharacter}
            disabled={saving}
            className="btn-primary w-full"
          >
            + New character
          </button>
          <div className="space-y-2">
            {characters.map((c) => (
              <div
                key={c.id}
                className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 ${
                  c.id === activeId
                    ? "border-primary bg-surface-2"
                    : "border-border bg-surface"
                }`}
              >
                <button
                  onClick={() => select(c)}
                  className="min-w-0 flex-1 truncate text-left text-sm text-gray-200 hover:text-primary"
                  title={c.name}
                >
                  {c.name}
                </button>
                <button
                  onClick={() => remove(c.id)}
                  className="shrink-0 text-xs text-gray-500 hover:text-red-400"
                  aria-label="Delete character"
                >
                  ✕
                </button>
              </div>
            ))}
            {!loading && characters.length === 0 && (
              <p className="px-1 text-xs text-gray-500">
                No characters yet. Create one, then let AppForge draft it from
                your Brain.
              </p>
            )}
          </div>
        </div>

        {/* Editor */}
        {loading ? (
          <Spinner label="Loading your characters…" />
        ) : activeId ? (
          <div className="card space-y-4">
            <div>
              <span className="label">Name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. James — PastorAI voice"
                className="input"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={draftFromBrain}
                disabled={drafting}
                className="btn-ghost text-sm disabled:opacity-60"
                title="Let AppForge draft this profile from your Brain"
              >
                {drafting ? "Drafting…" : "✨ Draft from my Brain"}
              </button>
              <span className="text-xs text-gray-500">
                Fills the fields below from your business context — then edit to
                taste.
              </span>
            </div>

            {FIELDS.map((f) => (
              <div key={f.key}>
                <span className="label">{f.label}</span>
                <textarea
                  value={profile[f.key]}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, [f.key]: e.target.value }))
                  }
                  placeholder={f.placeholder}
                  rows={f.rows}
                  className="input resize-none"
                />
              </div>
            ))}

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={save}
                disabled={saving}
                className="btn-primary disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save character"}
              </button>
            </div>
          </div>
        ) : (
          <div className="card grid place-items-center p-8 text-center">
            <div>
              <p className="text-sm text-gray-400">
                Create a character to define a reusable brand voice, then draft
                it from your Brain.
              </p>
              <button onClick={newCharacter} className="btn-primary mt-4">
                + New character
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
