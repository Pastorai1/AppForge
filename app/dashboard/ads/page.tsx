"use client";

import { useEffect, useRef, useState } from "react";
import { callAi } from "@/lib/api";
import type { AdVariation, AttractiveCharacter, SavedAdSet } from "@/lib/types";
import {
  AD_PLATFORMS,
  FUNNEL_STAGES,
  DEFAULT_AD_PLATFORM_IDS,
  adPlatformLabel,
  funnelStageLabel,
  getAdPlatform,
  getFunnelStage,
} from "@/lib/ad-platforms";
import { getCharacters, formatCharacterVoice } from "@/lib/characters-store";
import { getBrainFacts, formatBrainContext } from "@/lib/brain-store";
import { getAdSets, createAdSet, deleteAdSet } from "@/lib/ad-sets-store";
import { PageHeader, ErrorBanner } from "@/components/ui";

const COUNTS = [3, 4, 6];

export default function AdsPage() {
  const [characters, setCharacters] = useState<AttractiveCharacter[]>([]);
  const [characterId, setCharacterId] = useState<string>("");
  const [platforms, setPlatforms] = useState<string[]>(DEFAULT_AD_PLATFORM_IDS);
  const [stage, setStage] = useState<string>(FUNNEL_STAGES[0].id);
  const [perPlatform, setPerPlatform] = useState(4);
  const [topic, setTopic] = useState("");

  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [ads, setAds] = useState<AdVariation[]>([]);
  const [history, setHistory] = useState<SavedAdSet[]>([]);
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
      setHistory(await getAdSets());
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
    setAds([]);
    setCopied(null);

    const character = characters.find((c) => c.id === characterId) ?? null;
    const characterVoice = character ? formatCharacterVoice(character) : "";
    const characterName = character ? character.name : "";
    const stageSpec = getFunnelStage(stage);

    try {
      const brainContext = await loadBrain();
      const collected: AdVariation[] = [];

      for (const id of platforms) {
        const platform = getAdPlatform(id);
        if (!platform) continue;
        setProgress(platform.label);
        const { data } = await callAi<{
          ads: {
            hook: string;
            headline: string;
            primaryText: string;
            cta: string;
            creativeConcept: string;
          }[];
        }>("/api/ai/ads", {
          platformLabel: platform.label,
          platformGuidance: platform.guidance,
          stageLabel: stageSpec.label,
          stageGuidance: stageSpec.guidance,
          count: perPlatform,
          topic: topic.trim(),
          brainContext,
          characterVoice,
        });
        for (const a of data.ads ?? []) {
          collected.push({ platform: id, ...a });
        }
        setAds([...collected]);
      }

      setProgress(null);

      try {
        const saved = await createAdSet({
          topic: topic.trim(),
          characterName,
          funnelStage: stage,
          platforms,
          ads: collected,
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

  function viewHistory(set: SavedAdSet) {
    setAds(set.ads);
    setTopic(set.topic);
    setPlatforms(set.platforms.length ? set.platforms : DEFAULT_AD_PLATFORM_IDS);
    setStage(set.funnelStage || FUNNEL_STAGES[0].id);
    setCopied(null);
    if (typeof window !== "undefined")
      window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function removeHistory(id: string) {
    const snapshot = history;
    setHistory((prev) => prev.filter((s) => s.id !== id));
    try {
      await deleteAdSet(id);
    } catch {
      setHistory(snapshot);
    }
  }

  async function copyAd(i: number, a: AdVariation) {
    const text = `Hook: ${a.hook}\nHeadline: ${a.headline}\n\n${a.primaryText}\n\nCTA: ${a.cta}\nCreative: ${a.creativeConcept}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(i);
      setTimeout(() => setCopied((c) => (c === i ? null : c)), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  // Group generated ads by platform for display.
  const grouped = platforms
    .map((id) => ({
      id,
      label: adPlatformLabel(id),
      items: ads
        .map((a, i) => ({ a, i }))
        .filter(({ a }) => a.platform === id),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div>
      <PageHeader
        title="One-to-Many Ads"
        subtitle="Generate high-converting ad variations per platform and funnel stage, in your brand voice and grounded in your Brain."
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
            {AD_PLATFORMS.map((p) => (
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

        <div>
          <span className="label">Funnel stage</span>
          <div className="mt-1 flex flex-wrap gap-2">
            {FUNNEL_STAGES.map((s) => (
              <button
                key={s.id}
                onClick={() => setStage(s.id)}
                className={`chip ${
                  stage === s.id ? "chip-active" : "hover:border-primary"
                }`}
                title={s.guidance}
              >
                {s.label}
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
            <span className="label">Variations per platform</span>
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
          <span className="label">What are you advertising?</span>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. PastorAI — an AI ministry assistant that gives pastors back time for people. 14-day free trial at PastorAI.io."
            rows={3}
            className="input resize-none"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {generating && progress
              ? `Writing ${progress} ads…`
              : `${platforms.length} platform${
                  platforms.length === 1 ? "" : "s"
                } × ${perPlatform} = ${
                  platforms.length * perPlatform
                } ads · ${funnelStageLabel(stage)}`}
          </span>
          <button
            onClick={generate}
            disabled={generating || platforms.length === 0}
            className="btn-primary disabled:opacity-60"
          >
            {generating ? "Generating…" : "Generate ads"}
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
                <span className="text-gray-500">
                  ({g.items.length} · {funnelStageLabel(stage)})
                </span>
              </h2>
              <div className="space-y-3">
                {g.items.map(({ a, i }) => (
                  <div key={i} className="card space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 break-words text-sm font-semibold text-white">
                        {a.headline}
                      </p>
                      <button
                        onClick={() => copyAd(i, a)}
                        className="shrink-0 text-xs text-gray-400 hover:text-white"
                      >
                        {copied === i ? "Copied ✓" : "Copy"}
                      </button>
                    </div>
                    {a.hook && (
                      <p className="text-sm italic text-gray-300 break-words">
                        {a.hook}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap break-words text-sm text-gray-200">
                      {a.primaryText}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      {a.cta && (
                        <span>
                          <span className="text-gray-400">CTA:</span> {a.cta}
                        </span>
                      )}
                      {a.creativeConcept && (
                        <span>
                          <span className="text-gray-400">Creative:</span>{" "}
                          {a.creativeConcept}
                        </span>
                      )}
                    </div>
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
                    {s.platforms.map(adPlatformLabel).join(", ") || "Ads"}
                  </span>
                  <span className="text-gray-500">
                    {" "}
                    · {funnelStageLabel(s.funnelStage)}
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
                  aria-label="Delete ad set"
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
