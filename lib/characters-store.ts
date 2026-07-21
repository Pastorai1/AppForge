"use client";

import { isSupabaseConfigured } from "@/lib/env";
import type { AttractiveCharacter, CharacterProfile } from "@/lib/types";

/**
 * Unified store for Attractive Character (brand-voice) profiles — Supabase
 * when configured, localStorage in demo mode. Mirrors the other stores.
 */

export interface NewCharacter extends Partial<CharacterProfile> {
  name?: string;
}

const EMPTY: CharacterProfile = {
  identity: "",
  backstory: "",
  voice: "",
  audience: "",
  signaturePhrases: "",
  avoid: "",
};

const serverEnabled = (): boolean => isSupabaseConfigured();

const KEY = "appforge.characters";

function genId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function read(): AttractiveCharacter[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as AttractiveCharacter[];
  } catch {
    return [];
  }
}

function write(items: AttractiveCharacter[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error ?? "Character request failed.");
  }
  return json.data as T;
}

export async function getCharacters(): Promise<AttractiveCharacter[]> {
  if (!serverEnabled()) return read();
  return request<AttractiveCharacter[]>("/api/characters");
}

export async function createCharacter(
  input: NewCharacter,
): Promise<AttractiveCharacter> {
  if (!serverEnabled()) {
    const now = new Date().toISOString();
    const character: AttractiveCharacter = {
      id: genId(),
      name: input.name?.trim() || "New character",
      ...EMPTY,
      ...stripName(input),
      createdAt: now,
      updatedAt: now,
    };
    write([character, ...read()]);
    return character;
  }

  return request<AttractiveCharacter>("/api/characters", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateCharacter(
  id: string,
  patch: NewCharacter,
): Promise<AttractiveCharacter> {
  if (!serverEnabled()) {
    const now = new Date().toISOString();
    let updated: AttractiveCharacter | null = null;
    const next = read().map((c) => {
      if (c.id !== id) return c;
      updated = {
        ...c,
        ...(patch.name !== undefined ? { name: patch.name.trim() || c.name } : {}),
        ...stripName(patch),
        updatedAt: now,
      };
      return updated;
    });
    write(next);
    if (!updated) throw new Error("Character not found.");
    return updated;
  }

  return request<AttractiveCharacter>(`/api/characters/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteCharacter(id: string): Promise<void> {
  if (!serverEnabled()) {
    write(read().filter((c) => c.id !== id));
    return;
  }

  const res = await fetch(`/api/characters/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? "Failed to delete character.");
  }
}

/** Drops the `name` field, keeping only profile fields. */
function stripName(input: NewCharacter): Partial<CharacterProfile> {
  const { name: _name, ...profile } = input;
  return profile;
}

/**
 * Formats a character into a voice-instruction block for grounding the
 * one-to-many content tools. Those tools call this and prepend it.
 */
export function formatCharacterVoice(c: AttractiveCharacter): string {
  const parts: string[] = [];
  if (c.identity) parts.push(`Identity: ${c.identity}`);
  if (c.backstory) parts.push(`Backstory: ${c.backstory}`);
  if (c.voice) parts.push(`Voice & tone: ${c.voice}`);
  if (c.audience) parts.push(`Speaking to: ${c.audience}`);
  if (c.signaturePhrases) parts.push(`Signature phrases to lean on: ${c.signaturePhrases}`);
  if (c.avoid) parts.push(`Avoid: ${c.avoid}`);
  if (!parts.length) return "";
  return `Write in the voice of this character ("${c.name}"):\n\n${parts.join(
    "\n",
  )}`;
}
