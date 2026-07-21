"use client";

import { isSupabaseConfigured } from "@/lib/env";
import type { SavedSocialCalendar, SocialPost } from "@/lib/types";

/**
 * Unified store for saved one-to-many social content calendars (history) —
 * Supabase when configured, localStorage in demo mode. Mirrors the other
 * history stores.
 */

export interface NewSocialCalendar {
  topic: string;
  characterName: string;
  platforms: string[];
  posts: SocialPost[];
}

const serverEnabled = (): boolean => isSupabaseConfigured();

const KEY = "appforge.social-calendars";

function genId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `sc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function read(): SavedSocialCalendar[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(
      localStorage.getItem(KEY) ?? "[]",
    ) as SavedSocialCalendar[];
  } catch {
    return [];
  }
}

function write(items: SavedSocialCalendar[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error ?? "Social calendar request failed.");
  }
  return json.data as T;
}

export async function getSocialCalendars(): Promise<SavedSocialCalendar[]> {
  if (!serverEnabled()) return read();
  return request<SavedSocialCalendar[]>("/api/social-calendars");
}

export async function createSocialCalendar(
  input: NewSocialCalendar,
): Promise<SavedSocialCalendar> {
  if (!serverEnabled()) {
    const cal: SavedSocialCalendar = {
      id: genId(),
      topic: input.topic,
      characterName: input.characterName,
      platforms: input.platforms,
      posts: input.posts,
      createdAt: new Date().toISOString(),
    };
    write([cal, ...read()]);
    return cal;
  }

  return request<SavedSocialCalendar>("/api/social-calendars", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function deleteSocialCalendar(id: string): Promise<void> {
  if (!serverEnabled()) {
    write(read().filter((s) => s.id !== id));
    return;
  }

  const res = await fetch(`/api/social-calendars/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? "Failed to delete social calendar.");
  }
}
