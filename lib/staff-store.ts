"use client";

import { isSupabaseConfigured } from "@/lib/env";
import type { BuildMessage, StaffSession } from "@/lib/types";

/**
 * Unified store for Chief of Staff conversation threads (Supabase when
 * configured, localStorage in demo mode). Mirrors the build-session store.
 */

export interface NewStaffSession {
  title?: string;
  messages?: BuildMessage[];
}

const serverEnabled = (): boolean => isSupabaseConfigured();

const KEY = "appforge.staff-sessions";

function genId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function read(): StaffSession[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as StaffSession[];
  } catch {
    return [];
  }
}

function write(items: StaffSession[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error ?? "Staff session request failed.");
  }
  return json.data as T;
}

export async function getStaffSessions(): Promise<StaffSession[]> {
  if (!serverEnabled()) return read();
  return request<StaffSession[]>("/api/staff-sessions");
}

export async function getStaffSession(id: string): Promise<StaffSession | null> {
  if (!serverEnabled()) {
    return read().find((s) => s.id === id) ?? null;
  }
  try {
    return await request<StaffSession>(`/api/staff-sessions/${id}`);
  } catch {
    return null;
  }
}

export async function createStaffSession(
  input: NewStaffSession,
): Promise<StaffSession> {
  if (!serverEnabled()) {
    const now = new Date().toISOString();
    const session: StaffSession = {
      id: genId(),
      title: input.title?.trim() || "New conversation",
      messages: input.messages ?? [],
      createdAt: now,
      updatedAt: now,
    };
    write([session, ...read()]);
    return session;
  }

  return request<StaffSession>("/api/staff-sessions", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateStaffSession(
  id: string,
  patch: { messages?: BuildMessage[]; title?: string },
): Promise<StaffSession> {
  if (!serverEnabled()) {
    const now = new Date().toISOString();
    let updated: StaffSession | null = null;
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
    if (!updated) throw new Error("Staff session not found.");
    return updated;
  }

  return request<StaffSession>(`/api/staff-sessions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteStaffSession(id: string): Promise<void> {
  if (!serverEnabled()) {
    write(read().filter((s) => s.id !== id));
    return;
  }

  const res = await fetch(`/api/staff-sessions/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? "Failed to delete staff session.");
  }
}
