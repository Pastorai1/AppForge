"use client";

import { isSupabaseConfigured } from "@/lib/env";
import type { SavedViabilityScore, ViabilityScore } from "@/lib/types";

/**
 * Unified store for Viability score history (Supabase when configured,
 * localStorage in demo mode). Mirrors lib/market-store.
 */

export interface NewViabilityScore {
  idea: string;
  score: ViabilityScore;
}

const serverEnabled = (): boolean => isSupabaseConfigured();

const KEY = "appforge.viability-scores";

function genId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function read(): SavedViabilityScore[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as SavedViabilityScore[];
  } catch {
    return [];
  }
}

function write(items: SavedViabilityScore[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error ?? "Viability request failed.");
  }
  return json.data as T;
}

export async function getViabilityScores(): Promise<SavedViabilityScore[]> {
  if (!serverEnabled()) return read();
  return request<SavedViabilityScore[]>("/api/viability-scores");
}

export async function saveViabilityScore(
  input: NewViabilityScore,
): Promise<SavedViabilityScore> {
  if (!serverEnabled()) {
    const saved: SavedViabilityScore = {
      id: genId(),
      idea: input.idea,
      score: input.score,
      createdAt: new Date().toISOString(),
    };
    const items = read();
    items.unshift(saved);
    write(items);
    return saved;
  }

  return request<SavedViabilityScore>("/api/viability-scores", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function deleteViabilityScore(id: string): Promise<void> {
  if (!serverEnabled()) {
    write(read().filter((v) => v.id !== id));
    return;
  }

  const res = await fetch(`/api/viability-scores/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? "Failed to delete score.");
  }
}
