"use client";

import { isSupabaseConfigured } from "@/lib/env";
import type { SavedTechStack, TechStackRecommendation } from "@/lib/types";

/**
 * Unified store for Tech Stack recommendation history (Supabase when
 * configured, localStorage in demo mode). Mirrors lib/market-store.
 */

export interface NewTechStack {
  label: string;
  recommendation: TechStackRecommendation;
}

const serverEnabled = (): boolean => isSupabaseConfigured();

const KEY = "appforge.tech-stacks";

function genId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function read(): SavedTechStack[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as SavedTechStack[];
  } catch {
    return [];
  }
}

function write(items: SavedTechStack[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error ?? "Tech stack request failed.");
  }
  return json.data as T;
}

export async function getTechStacks(): Promise<SavedTechStack[]> {
  if (!serverEnabled()) return read();
  return request<SavedTechStack[]>("/api/tech-stacks");
}

export async function saveTechStack(
  input: NewTechStack,
): Promise<SavedTechStack> {
  if (!serverEnabled()) {
    const saved: SavedTechStack = {
      id: genId(),
      label: input.label,
      recommendation: input.recommendation,
      createdAt: new Date().toISOString(),
    };
    const items = read();
    items.unshift(saved);
    write(items);
    return saved;
  }

  return request<SavedTechStack>("/api/tech-stacks", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function deleteTechStack(id: string): Promise<void> {
  if (!serverEnabled()) {
    write(read().filter((t) => t.id !== id));
    return;
  }

  const res = await fetch(`/api/tech-stacks/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? "Failed to delete recommendation.");
  }
}
