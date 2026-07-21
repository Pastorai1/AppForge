"use client";

import { useEffect, useRef, useState } from "react";
import { callAi } from "@/lib/api";
import type {
  AttractiveCharacter,
  SavedSocialCalendar,
  SocialPost,
} from "@/lib/types";
import {
  SOCIAL_PLATFORMS,
  DEFAULT_PLATFORM_IDS,
  platformLabel,
  getPlatform,
} from "@/lib/social-platforms";
import { getCharacters, formatCharacterVoice } from "@/lib/characters-store";
import { getBrainFacts, formatBrainContext } from "@/lib/brain-store";
import {
  getSocialCalendars,
  createSocialCalendar,
  deleteSocialCalendar,
} from "@/lib/social-calendars-store";
import { PageHeader, ErrorBanner } from "@/components/ui";

const COUNTS = [3, 5, 7];

export default function SocialPage() {
  const [characters, setCharacters] = useState<AttractiveCharacter[]>([]);
  const [characterId, setCharacterId] = useState<string>("");
  const [platforms, setPlatforms] = useState<string[]>(DEFAULT_PLATFORM_IDS);
  const [perPlatform, setPerPlatform] = useState(5);
  const [topic, setTopic] = useState("");

  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [history, setHistory] = useState<SavedSocialCalendar[]>([]);
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
      setHistory(await getSocialCalendars());
    } catch {
      /* non-fatal */
    }
  }

  function togglePlatform(id: string) {
    setPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  async function generate() {
    if (generating || platforms.length === 0) return;
    setGenerating(true);
    setError(null);
    setPosts([]);
    setCopied(null);

    const character = characters.find((c) => c.id === characterId) ?? null;
    const characterVoice = character ? formatCharacterVoice(character) : "";
    const characterName = character ? character.name : "";

    try {
      const brainContext = await loadBrain();
      const collected: SocialPost[] = [];

      for (const id of platforms) {
        const platform = getPlatform(id);
        if (!platform) continue;
        setProgress(platform.label);
        const { data } = await callAi<{
          posts: {
            hook: string;
            caption: string;
            hashtags: string;
            format: string;
          }[];
        }>("/api/ai/social", {
          platformLabel: platform.label,
          platformGuidance: platform.guidance,
          count: perPlatform,
          topic: topic.trim(),
          brainContext,
          characterVoice,
        });
        for (const p of data.posts ?? []) {
          collected.push({ platform: id, ...p });
        }
        setPosts([...collected]);
      }

      setProgress(null);

      try {
        const saved = await createSocialCalendar({
          topic: topic.trim(),
          characterName,
          platforms,
          posts: collected,
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

  function viewHistory(cal: SavedSocialCalendar) {
    setPosts(cal.posts);
    setTopic(cal.topic);
    setPlatforms(cal.platforms.length ? cal.platforms : DEFAULT_PLATFORM_IDS);
    setCopied(null);
    if (typeof window !== "undefined")
      window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function removeHistory(id: string) {
    const snapshot = history;
    setHistory((prev) => prev.filter((s) => s.id !== id));
    try {
      await deleteSocialCalendar(id);
    } catch {
      setHistory(snapshot);
    }
  }

  async function copyPost(i: number, p: SocialPost) {
    const text = p.hashtags ? `${p.caption}\n\n${p.hashtags}` : p.caption;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(i);
      setTimeout(() => setCopied((c) => (c === i ? null : c)), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  // Group generated posts by platform for display, preserving platform order.
  const grouped = platforms
    .map((id) => ({
      id,
      label: platformLabel(id),
      items: posts
        .map((p, i) => ({ p, i }))
        .filter(({ p }) => p.platform === id),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div>
      <PageHeader
        title="One-to-Many Social"
        subtitle="Turn one theme into a full content calendar across your platforms, in your brand voice and grounded in your Brain."
      />

      {error ? (
        <div className="mb-4">
          <ErrorBanner error={error} />
        </div>
      ) : null}

      {/* Controls */}
      <div className="card mb-6 space-y-4">
        <div>
          <span className="label">Platforms</span>
          <div className="mt-1 flex flex-wrap gap-2">
            {SOCIAL_PLATFORMS.map((p) => (
              <button
                key={p.id}
                onClick={() => togglePlatform(p.id)}
                className={`chip ${
                  platforms.includes(p.id)
                    ? "chip-active"
                    : "hover:border-primary"
                }`}
                title={p.guidance}
              >
                {p.label}
              </button>
            ))}
          </div>
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
          </div>
          <div>
            <span className="label">Posts per platform</span>
            <div className="mt-1 flex gap-2">
              {COUNTS.map((n) => (
                <button
                  key={n}
                  onClick={() => setPerPlatform(n)}
                  className={`chip ${
                    perPlatform === n ? "chip-active" : "hover:border-primary"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <span className="label">Theme / what to post about</span>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. The 'What Pastors Are Telling Me' series — insights from real pastor interviews about reclaiming time for ministry."
            rows={3}
            className="input resize-none"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {generating && progress
              ? `Writing ${progress} posts…`
              : `${platforms.length} platform${
                  platforms.length === 1 ? "" : "s"
                } × ${perPlatform} = ${
                  platforms.length * perPlatform
                } posts. Generated one platform at a time.`}
          </span>
          <button
            onClick={generate}
            disabled={generating || platforms.length === 0}
            className="btn-primary disabled:opacity-60"
          >
            {generating ? "Generating…" : "Generate calendar"}
          </button>
        </div>
      </div>

      {/* Result grouped by platform */}
      {grouped.length > 0 && (
        <div className="mb-8 space-y-6">
          {grouped.map((g) => (
            <section key={g.id}>
              <h2 className="mb-2 text-sm font-semibold text-white">
                {g.label}{" "}
                <span className="text-gray-500">({g.items.length})</span>
              </h2>
              <div className="space-y-3">
                {g.items.map(({ p, i }) => (
                  <div key={i} className="card space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <span className="chip chip-active shrink-0">
                        {p.format || "Post"}
                      </span>
                      <button
                        onClick={() => copyPost(i, p)}
                        className="shrink-0 text-xs text-gray-400 hover:text-white"
                      >
                        {copied === i ? "Copied ✓" : "Copy"}
                      </button>
                    </div>
                    {p.hook && (
                      <p className="text-sm font-semibold text-white">
                        {p.hook}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap text-sm text-gray-200">
                      {p.caption}
                    </p>
                    {p.hashtags && (
                      <p className="text-xs text-primary">{p.hashtags}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
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
                  onClick={() => viewHistory(s)}
                  className="min-w-0 flex-1 text-left text-sm text-gray-200 hover:text-primary"
                >
                  <span className="font-medium">
                    {s.platforms.map(platformLabel).join(", ") || "Calendar"}
                  </span>
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
                  aria-label="Delete calendar"
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
