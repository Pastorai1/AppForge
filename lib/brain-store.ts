"use client";

import { isSupabaseConfigured } from "@/lib/env";
import type { BrainFact } from "@/lib/types";

/**
 * Unified store for the Brain — the user's shared business-context facts that
 * every marketing tool reads from (Supabase when configured, localStorage in
 * demo mode).
 */

export interface NewBrainFact {
  category: string;
  content: string;
}

const serverEnabled = (): boolean => isSupabaseConfigured();

const KEY = "appforge.brain-facts";

function genId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `bf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function read(): BrainFact[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as BrainFact[];
  } catch {
    return [];
  }
}

function write(items: BrainFact[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error ?? "Brain request failed.");
  }
  return json.data as T;
}

export async function getBrainFacts(): Promise<BrainFact[]> {
  if (!serverEnabled()) return read();
  return request<BrainFact[]>("/api/brain");
}

export async function addBrainFact(input: NewBrainFact): Promise<BrainFact> {
  if (!serverEnabled()) {
    const fact: BrainFact = {
      id: genId(),
      category: input.category || "Other",
      content: input.content,
      createdAt: new Date().toISOString(),
    };
    write([...read(), fact]);
    return fact;
  }
  return request<BrainFact>("/api/brain", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateBrainFact(
  id: string,
  patch: { content?: string; category?: string },
): Promise<BrainFact> {
  if (!serverEnabled()) {
    let updated: BrainFact | null = null;
    const next = read().map((f) => {
      if (f.id !== id) return f;
      updated = { ...f, ...patch };
      return updated;
    });
    write(next);
    if (!updated) throw new Error("Fact not found.");
    return updated;
  }
  return request<BrainFact>(`/api/brain/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteBrainFact(id: string): Promise<void> {
  if (!serverEnabled()) {
    write(read().filter((f) => f.id !== id));
    return;
  }
  const res = await fetch(`/api/brain/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? "Failed to delete fact.");
  }
}

/**
 * Formats the Brain into a context string for grounding AI tool prompts.
 * Future marketing tools call this and prepend it to their prompts.
 */
export function formatBrainContext(facts: BrainFact[]): string {
  if (!facts.length) return "";
  const byCategory: Record<string, string[]> = {};
  for (const f of facts) {
    if (!byCategory[f.category]) byCategory[f.category] = [];
    byCategory[f.category].push(f.content);
  }
  const sections = Object.entries(byCategory).map(
    ([category, items]) =>
      `${category}:\n${items.map((c) => `- ${c}`).join("\n")}`,
  );
  return `Here is what you know about the user and their business:\n\n${sections.join(
    "\n\n",
  )}`;
}
