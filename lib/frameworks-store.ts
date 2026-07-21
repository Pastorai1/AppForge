"use client";

import { isSupabaseConfigured } from "@/lib/env";
import type { ExtractedFramework, SavedFramework } from "@/lib/types";

/**
 * Unified store for saved signature frameworks (history) — Supabase when
 * configured, localStorage in demo mode. Mirrors the other history stores.
 */

export interface NewFramework {
  name: string;
  framework: ExtractedFramework;
}

const serverEnabled = (): boolean => isSupabaseConfigured();

const KEY = "appforge.frameworks";

function genId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `fw_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function read(): SavedFramework[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as SavedFramework[];
  } catch {
    return [];
  }
}

function write(items: SavedFramework[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error ?? "Framework request failed.");
  }
  return json.data as T;
}

export async function getFrameworks(): Promise<SavedFramework[]> {
  if (!serverEnabled()) return read();
  return request<SavedFramework[]>("/api/frameworks");
}

export async function createFramework(
  input: NewFramework,
): Promise<SavedFramework> {
  if (!serverEnabled()) {
    const f: SavedFramework = {
      id: genId(),
      name: input.name,
      framework: input.framework,
      createdAt: new Date().toISOString(),
    };
    write([f, ...read()]);
    return f;
  }

  return request<SavedFramework>("/api/frameworks", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function deleteFramework(id: string): Promise<void> {
  if (!serverEnabled()) {
    write(read().filter((s) => s.id !== id));
    return;
  }

  const res = await fetch(`/api/frameworks/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? "Failed to delete framework.");
  }
}
