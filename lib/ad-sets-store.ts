"use client";

import { isSupabaseConfigured } from "@/lib/env";
import type { AdVariation, SavedAdSet } from "@/lib/types";

/**
 * Unified store for saved one-to-many ad sets (history) — Supabase when
 * configured, localStorage in demo mode. Mirrors the other history stores.
 */

export interface NewAdSet {
  topic: string;
  characterName: string;
  funnelStage: string;
  platforms: string[];
  ads: AdVariation[];
}

const serverEnabled = (): boolean => isSupabaseConfigured();

const KEY = "appforge.ad-sets";

function genId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `ad_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function read(): SavedAdSet[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as SavedAdSet[];
  } catch {
    return [];
  }
}

function write(items: SavedAdSet[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error ?? "Ad set request failed.");
  }
  return json.data as T;
}

export async function getAdSets(): Promise<SavedAdSet[]> {
  if (!serverEnabled()) return read();
  return request<SavedAdSet[]>("/api/ad-sets");
}

export async function createAdSet(input: NewAdSet): Promise<SavedAdSet> {
  if (!serverEnabled()) {
    const set: SavedAdSet = {
      id: genId(),
      topic: input.topic,
      characterName: input.characterName,
      funnelStage: input.funnelStage,
      platforms: input.platforms,
      ads: input.ads,
      createdAt: new Date().toISOString(),
    };
    write([set, ...read()]);
    return set;
  }

  return request<SavedAdSet>("/api/ad-sets", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function deleteAdSet(id: string): Promise<void> {
  if (!serverEnabled()) {
    write(read().filter((s) => s.id !== id));
    return;
  }

  const res = await fetch(`/api/ad-sets/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? "Failed to delete ad set.");
  }
}
