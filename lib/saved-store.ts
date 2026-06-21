"use client";

import { isSupabaseConfigured } from "@/lib/env";
import type {
  AppOpportunity,
  SavedItem,
  SavedItemKind,
  TopApp,
} from "@/lib/types";

/**
 * Unified store for saved/bookmarked items from the Top Apps and Opportunities
 * lists (Supabase when configured, localStorage in demo mode).
 */

export interface NewSavedItem {
  kind: SavedItemKind;
  itemKey: string;
  payload: TopApp | AppOpportunity;
}

const serverEnabled = (): boolean => isSupabaseConfigured();

const KEY = "appforge.saved-items";

function genId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function read(): SavedItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as SavedItem[];
  } catch {
    return [];
  }
}

function write(items: SavedItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error ?? "Saved item request failed.");
  }
  return json.data as T;
}

export async function getSavedItems(
  kind?: SavedItemKind,
): Promise<SavedItem[]> {
  if (!serverEnabled()) {
    const all = read();
    return kind ? all.filter((i) => i.kind === kind) : all;
  }
  const qs = kind ? `?kind=${kind}` : "";
  return request<SavedItem[]>(`/api/saved-items${qs}`);
}

export async function saveItem(input: NewSavedItem): Promise<SavedItem> {
  const itemKey = input.itemKey.trim().toLowerCase();
  if (!serverEnabled()) {
    const items = read();
    const existing = items.find(
      (i) => i.kind === input.kind && i.itemKey === itemKey,
    );
    if (existing) return existing;
    const saved: SavedItem = {
      id: genId(),
      kind: input.kind,
      itemKey,
      payload: input.payload,
      createdAt: new Date().toISOString(),
    };
    write([saved, ...items]);
    return saved;
  }

  return request<SavedItem>("/api/saved-items", {
    method: "POST",
    body: JSON.stringify({ ...input, itemKey }),
  });
}

export async function deleteSavedItem(id: string): Promise<void> {
  if (!serverEnabled()) {
    write(read().filter((i) => i.id !== id));
    return;
  }

  const res = await fetch(`/api/saved-items/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? "Failed to remove saved item.");
  }
}
