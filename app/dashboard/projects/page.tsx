"use client";

import { useEffect, useState } from "react";
import { PROJECT_STAGES, type Project, type ProjectStage } from "@/lib/types";
import {
  getLocalProjects,
  addLocalProject,
  updateLocalProjectStage,
  deleteLocalProject,
} from "@/lib/projects-store";
import { PageHeader } from "@/components/ui";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [title, setTitle] = useState("");

  useEffect(() => {
    setProjects(getLocalProjects());
  }, []);

  function refresh() {
    setProjects(getLocalProjects());
  }

  function add() {
    if (!title.trim()) return;
    addLocalProject({ title: title.trim(), description: "", score: null });
    setTitle("");
    refresh();
  }

  function moveTo(stage: ProjectStage) {
    if (!dragId) return;
    updateLocalProjectStage(dragId, stage);
    setDragId(null);
    refresh();
  }

  function remove(id: string) {
    deleteLocalProject(id);
    refresh();
  }

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle="Track ideas from Scoping → Building → Review → Live. Drag cards between columns."
      />

      <div className="card mb-6 flex flex-col gap-3 sm:flex-row">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="New project title…"
          className="input"
        />
        <button onClick={add} className="btn-primary shrink-0">
          Add project
        </button>
      </div>

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

      <p className="mt-6 text-xs text-gray-500">
        Projects are saved in your browser. Connect Supabase to sync across
        devices.
      </p>
    </div>
  );
}
