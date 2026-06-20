"use client";

import { isSupabaseConfigured } from "@/lib/env";
import type { BuildMessage, BuildSession } from "@/lib/types";

/**
 * Unified store for conversational build sessions (Supabase when configured,
 * localStorage in demo mode). Mirrors the other AppForge stores.
 */

export interface NewBuildSession {
  title?: string;
  referenceApp?: string | null;
  messages?: BuildMessage[];
}

const serverEnabled = (): boolean => isSupabaseConfigured();

const KEY = "appforge.build-sessions";

function genId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `b_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function read(): BuildSession[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as BuildSession[];
  } catch {
    return [];
  }
}

function write(items: BuildSession[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error ?? "Build session request failed.");
  }
  return json.data as T;
}

export async function getBuildSessions(): Promise<BuildSession[]> {
  if (!serverEnabled()) return read();
  return request<BuildSession[]>("/api/build-sessions");
}

export async function getBuildSession(id: string): Promise<BuildSession | null> {
  if (!serverEnabled()) {
    return read().find((s) => s.id === id) ?? null;
  }
  try {
    return await request<BuildSession>(`/api/build-sessions/${id}`);
  } catch {
    return null;
  }
}

export async function createBuildSession(
  input: NewBuildSession,
): Promise<BuildSession> {
  if (!serverEnabled()) {
    const now = new Date().toISOString();
    const session: BuildSession = {
      id: genId(),
      title: input.title?.trim() || "New build",
      referenceApp: input.referenceApp ?? null,
      messages: input.messages ?? [],
      createdAt: now,
      updatedAt: now,
    };
    write([session, ...read()]);
    return session;
  }

  return request<BuildSession>("/api/build-sessions", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateBuildSession(
  id: string,
  patch: { messages?: BuildMessage[]; title?: string },
): Promise<BuildSession> {
  if (!serverEnabled()) {
    const now = new Date().toISOString();
    let updated: BuildSession | null = null;
    const next = read().map((s) => {
      if (s.id !== id) return s;
      updated = {
        ...s,
        ...(patch.messages ? { messages: patch.messages } : {}),
        ...(patch.title ? { title: patch.title } : {}),
        updatedAt: now,
      };
      return updated;
    });
    write(next);
    if (!updated) throw new Error("Build session not found.");
    return updated;
  }

  return request<BuildSession>(`/api/build-sessions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteBuildSession(id: string): Promise<void> {
  if (!serverEnabled()) {
    write(read().filter((s) => s.id !== id));
    return;
  }

  const res = await fetch(`/api/build-sessions/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? "Failed to delete build session.");
  }
}
