"use client";

import { isSupabaseConfigured } from "@/lib/env";
import type { PresentationSection, SavedPresentation } from "@/lib/types";

/**
 * Unified store for saved presentation scripts (history) — Supabase when
 * configured, localStorage in demo mode. Mirrors the other history stores.
 */

export interface NewPresentation {
  topic: string;
  characterName: string;
  sections: PresentationSection[];
}

const serverEnabled = (): boolean => isSupabaseConfigured();

const KEY = "appforge.presentations";

function genId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function read(): SavedPresentation[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as SavedPresentation[];
  } catch {
    return [];
  }
}

function write(items: SavedPresentation[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error ?? "Presentation request failed.");
  }
  return json.data as T;
}

export async function getPresentations(): Promise<SavedPresentation[]> {
  if (!serverEnabled()) return read();
  return request<SavedPresentation[]>("/api/presentations");
}

export async function createPresentation(
  input: NewPresentation,
): Promise<SavedPresentation> {
  if (!serverEnabled()) {
    const p: SavedPresentation = {
      id: genId(),
      topic: input.topic,
      characterName: input.characterName,
      sections: input.sections,
      createdAt: new Date().toISOString(),
    };
    write([p, ...read()]);
    return p;
  }

  return request<SavedPresentation>("/api/presentations", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function deletePresentation(id: string): Promise<void> {
  if (!serverEnabled()) {
    write(read().filter((s) => s.id !== id));
    return;
  }

  const res = await fetch(`/api/presentations/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? "Failed to delete presentation.");
  }
}
