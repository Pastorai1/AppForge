"use client";

import { isSupabaseConfigured } from "@/lib/env";
import type {
  EmailSequenceType,
  GeneratedEmail,
  SavedEmailSequence,
} from "@/lib/types";

/**
 * Unified store for saved one-to-many email sequences (history) — Supabase
 * when configured, localStorage in demo mode. Mirrors the other history stores.
 */

export interface NewEmailSequence {
  type: EmailSequenceType;
  label: string;
  topic: string;
  characterName: string;
  emails: GeneratedEmail[];
}

const serverEnabled = (): boolean => isSupabaseConfigured();

const KEY = "appforge.email-sequences";

function genId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `e_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function read(): SavedEmailSequence[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as SavedEmailSequence[];
  } catch {
    return [];
  }
}

function write(items: SavedEmailSequence[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error ?? "Email sequence request failed.");
  }
  return json.data as T;
}

export async function getEmailSequences(): Promise<SavedEmailSequence[]> {
  if (!serverEnabled()) return read();
  return request<SavedEmailSequence[]>("/api/email-sequences");
}

export async function createEmailSequence(
  input: NewEmailSequence,
): Promise<SavedEmailSequence> {
  if (!serverEnabled()) {
    const seq: SavedEmailSequence = {
      id: genId(),
      type: input.type,
      label: input.label,
      topic: input.topic,
      characterName: input.characterName,
      emails: input.emails,
      createdAt: new Date().toISOString(),
    };
    write([seq, ...read()]);
    return seq;
  }

  return request<SavedEmailSequence>("/api/email-sequences", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function deleteEmailSequence(id: string): Promise<void> {
  if (!serverEnabled()) {
    write(read().filter((s) => s.id !== id));
    return;
  }

  const res = await fetch(`/api/email-sequences/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? "Failed to delete email sequence.");
  }
}
