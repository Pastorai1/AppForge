"use client";

import { useEffect, useState } from "react";
import { PROJECT_STAGES, type Project, type ProjectStage } from "@/lib/types";
import {
  getProjects,
  addProject,
  updateProjectStage,
  deleteProject,
} from "@/lib/projects-store";
import { isSupabaseConfigured } from "@/lib/env";
import { PageHeader } from "@/components/ui";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const synced = isSupabaseConfigured();

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setProjects(await getProjects());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects.");
    } finally {
      setLoading(false);
    }
  }

  async function add() {
    const name = title.trim();
    if (!name || adding) return;
    setAdding(true);
    setError(null);
    try {
      const project = await addProject({ title: name, description: "", score: null });
      setProjects((prev) => [project, ...prev]);
      setTitle("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add project.");
    } finally {
      setAdding(false);
    }
  }

  async function moveTo(stage: ProjectStage) {
    const id = dragId;
    setDragId(null);
    if (!id) return;

    const current = projects.find((p) => p.id === id);
    if (!current || current.stage === stage) return;

    // Optimistic move — revert on failure.
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, stage } : p)));
    setError(null);
    try {
      await updateProjectStage(id, stage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to move project.");
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, stage: current.stage } : p)),
      );
    }
  }

  async function remove(id: string) {
    const snapshot = projects;
    // Optimistic remove — restore on failure.
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setError(null);
    try {
      await deleteProject(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete project.");
      setProjects(snapshot);
    }
  }

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle="Track ideas from Scoping → Building → Review → Live. Drag cards between columns."
      />

      {error && (
        <div className="card mb-6 border-red-500/40 bg-red-500/10 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="card mb-6 flex flex-col gap-3 sm:flex-row">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="New project title…"
          className="input"
        />
        <button
          onClick={add}
          disabled={adding}
          className="btn-primary shrink-0 disabled:opacity-60"
        >
          {adding ? "Adding…" : "Add project"}
        </button>
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-gray-500">
          Loading projects…
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          {PROJECT_STAGES.map((stage) => {
            const items = projects.filter((p) => p.stage === stage);
            return (
              <div
                key={stage}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => moveTo(stage)}
                className="rounded-xl border border-border bg-surface/50 p-3"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">{stage}</h3>
                  <span className="chip">{items.length}</span>
                </div>

                <div className="space-y-3">
                  {items.map((p) => (
                    <div
                      key={p.id}
                      draggable
                      onDragStart={() => setDragId(p.id)}
                      className="cursor-grab rounded-lg border border-border bg-surface p-3 active:cursor-grabbing"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-white">
                          {p.title}
                        </p>
                        <button
                          onClick={() => remove(p.id)}
                          className="text-xs text-gray-500 hover:text-red-400"
                          aria-label="Delete project"
                        >
                          ✕
                        </button>
                      </div>
                      {p.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                          {p.description}
                        </p>
                      )}
                      {p.score !== null && (
                        <span className="chip mt-2">Score {p.score}</span>
                      )}
                    </div>
                  ))}
                  {items.length === 0 && (
                    <p className="py-6 text-center text-xs text-gray-600">
                      Drop here
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-6 text-xs text-gray-500">
        {synced
          ? "Projects sync to your account across devices."
          : "Projects are saved in your browser. Connect Supabase to sync across devices."}
      </p>
    </div>
  );
}
