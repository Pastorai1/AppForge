"use client";

import { isSupabaseConfigured } from "@/lib/env";
import type { MarketAnalysis, SavedMarketAnalysis } from "@/lib/types";

/**
 * Unified store for Market Analysis history, with two backends chosen
 * automatically (mirrors lib/listings-store):
 *
 *  - **Connected mode** (Supabase configured): persists to the
 *    `market_analyses` table via the `/api/market-analyses` routes.
 *  - **Demo mode** (no Supabase): persists to `localStorage`.
 */

export interface NewMarketAnalysis {
  category: string;
  analysis: MarketAnalysis;
}

const serverEnabled = (): boolean => isSupabaseConfigured();

// ── localStorage backend (demo mode) ──────────────────────────────

const KEY = "appforge.market-analyses";

function genId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function read(): SavedMarketAnalysis[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as SavedMarketAnalysis[];
  } catch {
    return [];
  }
}

function write(items: SavedMarketAnalysis[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

// ── HTTP helper (connected mode) ──────────────────────────────────

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error ?? "Market analysis request failed.");
  }
  return json.data as T;
}

// ── Public API (backend-agnostic) ─────────────────────────────────

export async function getMarketAnalyses(): Promise<SavedMarketAnalysis[]> {
  if (!serverEnabled()) return read();
  return request<SavedMarketAnalysis[]>("/api/market-analyses");
}

export async function saveMarketAnalysis(
  input: NewMarketAnalysis,
): Promise<SavedMarketAnalysis> {
  if (!serverEnabled()) {
    const saved: SavedMarketAnalysis = {
      id: genId(),
      category: input.category,
      analysis: input.analysis,
      createdAt: new Date().toISOString(),
    };
    const items = read();
    items.unshift(saved);
    write(items);
    return saved;
  }

  return request<SavedMarketAnalysis>("/api/market-analyses", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function deleteMarketAnalysis(id: string): Promise<void> {
  if (!serverEnabled()) {
    write(read().filter((m) => m.id !== id));
    return;
  }

  const res = await fetch(`/api/market-analyses/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? "Failed to delete analysis.");
  }
}
