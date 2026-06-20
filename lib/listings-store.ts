"use client";

import { isSupabaseConfigured } from "@/lib/env";
import type { SavedListing, StoreListing } from "@/lib/types";

/**
 * Unified store for saved store-listings, with two backends chosen
 * automatically (mirrors lib/projects-store):
 *
 *  - **Connected mode** (Supabase configured): persists to the `listings`
 *    table via the `/api/listings` routes.
 *  - **Demo mode** (no Supabase): persists to `localStorage`.
 */

export interface NewListing {
  appName: string;
  listing: StoreListing;
}

const serverEnabled = (): boolean => isSupabaseConfigured();

// ── localStorage backend (demo mode) ──────────────────────────────

const KEY = "appforge.listings";

function genId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `l_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function read(): SavedListing[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as SavedListing[];
  } catch {
    return [];
  }
}

function write(listings: SavedListing[]) {
  localStorage.setItem(KEY, JSON.stringify(listings));
}

// ── HTTP helper (connected mode) ──────────────────────────────────

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error ?? "Listing request failed.");
  }
  return json.data as T;
}

// ── Public API (backend-agnostic) ─────────────────────────────────

export async function getListings(): Promise<SavedListing[]> {
  if (!serverEnabled()) return read();
  return request<SavedListing[]>("/api/listings");
}

export async function saveListing(input: NewListing): Promise<SavedListing> {
  if (!serverEnabled()) {
    const saved: SavedListing = {
      id: genId(),
      appName: input.appName,
      listing: input.listing,
      createdAt: new Date().toISOString(),
    };
    const listings = read();
    listings.unshift(saved);
    write(listings);
    return saved;
  }

  return request<SavedListing>("/api/listings", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function deleteListing(id: string): Promise<void> {
  if (!serverEnabled()) {
    write(read().filter((l) => l.id !== id));
    return;
  }

  const res = await fetch(`/api/listings/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? "Failed to delete listing.");
  }
}
