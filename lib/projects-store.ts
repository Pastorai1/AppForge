"use client";

import { isSupabaseConfigured } from "@/lib/env";
import type { Project, ProjectStage } from "@/lib/types";

/**
 * Unified project store with two backends, chosen automatically:
 *
 *  - **Connected mode** (Supabase configured): persists to the `projects` table
 *    via the `/api/projects` routes, so projects sync across devices.
 *  - **Demo mode** (no Supabase): persists to `localStorage`, so the Kanban
 *    stays fully functional with no database.
 *
 * The page calls the same async functions in both cases — only the backend
 * differs.
 */

export interface NewProject {
  title: string;
  description?: string;
  score?: number | null;
  stage?: ProjectStage;
}

const serverEnabled = (): boolean => isSupabaseConfigured();

// ── localStorage backend (demo mode) ──────────────────────────────

const KEY = "appforge.projects";

/** UUID that also works outside secure contexts (plain HTTP / old browsers). */
function genId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function read(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as Project[];
  } catch {
    return [];
  }
}

function write(projects: Project[]) {
  localStorage.setItem(KEY, JSON.stringify(projects));
}

// ── HTTP helper (connected mode) ──────────────────────────────────

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error ?? "Project request failed.");
  }
  return json.data as T;
}

// ── Public API (backend-agnostic) ─────────────────────────────────

export async function getProjects(): Promise<Project[]> {
  if (!serverEnabled()) return read();
  return request<Project[]>("/api/projects");
}

export async function addProject(input: NewProject): Promise<Project> {
  if (!serverEnabled()) {
    const project: Project = {
      id: genId(),
      title: input.title,
      description: input.description ?? "",
      score: input.score ?? null,
      stage: input.stage ?? "Scoping",
    };
    const projects = read();
    projects.unshift(project);
    write(projects);
    return project;
  }

  return request<Project>("/api/projects", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateProjectStage(
  id: string,
  stage: ProjectStage,
): Promise<void> {
  if (!serverEnabled()) {
    write(read().map((p) => (p.id === id ? { ...p, stage } : p)));
    return;
  }

  await request<Project>(`/api/projects/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ stage }),
  });
}

export async function deleteProject(id: string): Promise<void> {
  if (!serverEnabled()) {
    write(read().filter((p) => p.id !== id));
    return;
  }

  const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? "Failed to delete project.");
  }
}
