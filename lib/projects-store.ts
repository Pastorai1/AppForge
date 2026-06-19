"use client";

import type { Project, ProjectStage } from "@/lib/types";

/**
 * Lightweight client-side project store backed by localStorage.
 *
 * This keeps the Projects Kanban fully functional in demo mode (no database
 * required). When you wire up Supabase, you can swap these functions for calls
 * to the `projects` table — the rest of the UI won't need to change.
 */

const KEY = "appforge.projects";

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

export function getLocalProjects(): Project[] {
  return read();
}

export function addLocalProject(input: {
  title: string;
  description: string;
  score: number | null;
  stage?: ProjectStage;
}): Project {
  const project: Project = {
    id: crypto.randomUUID(),
    title: input.title,
    description: input.description,
    score: input.score,
    stage: input.stage ?? "Scoping",
  };
  const projects = read();
  projects.unshift(project);
  write(projects);
  return project;
}

export function updateLocalProjectStage(id: string, stage: ProjectStage) {
  const projects = read().map((p) => (p.id === id ? { ...p, stage } : p));
  write(projects);
}

export function deleteLocalProject(id: string) {
  write(read().filter((p) => p.id !== id));
}
