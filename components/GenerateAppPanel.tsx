"use client";

import { useEffect, useRef, useState } from "react";
import { callAi } from "@/lib/api";
import type { AppBlueprint, GeneratedFile } from "@/lib/types";
import { Spinner, ErrorBanner } from "@/components/ui";

type Phase = "blueprint" | "files" | "done" | "error";

export function GenerateAppPanel({
  plan,
  onClose,
}: {
  plan: string;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("blueprint");
  const [blueprint, setBlueprint] = useState<AppBlueprint | null>(null);
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [progress, setProgress] = useState("Designing your app…");
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generate() {
    try {
      setPhase("blueprint");
      setProgress("Designing your app…");
      const { data: bp } = await callAi<AppBlueprint>(
        "/api/ai/generate-app/blueprint",
        { plan },
      );
      setBlueprint(bp);

      setPhase("files");
      const collected: GeneratedFile[] = [];
      for (let i = 0; i < bp.files.length; i++) {
        const f = bp.files[i];
        setProgress(`Writing ${f.path} (${i + 1}/${bp.files.length})…`);
        try {
          const { data } = await callAi<GeneratedFile>(
            "/api/ai/generate-app/file",
            {
              appName: bp.appName,
              summary: bp.summary,
              files: bp.files,
              path: f.path,
              purpose: f.purpose,
            },
          );
          collected.push(data);
        } catch {
          collected.push({
            path: f.path,
            content: `// ${f.path}\n// (generation failed for this file — try again)\n`,
          });
        }
        setFiles([...collected]);
        if (!selected) setSelected(collected[0]?.path ?? null);
      }
      setPhase("done");
      setProgress("");
    } catch (e) {
      setError(e);
      setPhase("error");
    }
  }

  async function downloadZip() {
    if (!blueprint || files.length === 0) return;
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    for (const f of files) zip.file(f.path, f.content);
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${blueprint.appName || "app"}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const active = files.find((f) => f.path === selected);
  const working = phase === "blueprint" || phase === "files";

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex h-[88vh] w-full max-w-5xl flex-col rounded-xl border border-border bg-surface"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border p-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-white">
              {blueprint?.appName ?? "Generating app…"}
            </h2>
            {blueprint?.summary && (
              <p className="mt-0.5 text-sm text-gray-400">{blueprint.summary}</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={downloadZip}
              disabled={files.length === 0}
              className="btn-primary disabled:opacity-50"
            >
              Download .zip
            </button>
            <button onClick={onClose} className="chip hover:border-primary">
              Close
            </button>
          </div>
        </div>

        {working && (
          <div className="border-b border-border px-4 py-2">
            <Spinner label={progress} />
          </div>
        )}
        {error ? (
          <div className="p-4">
            <ErrorBanner error={error} />
          </div>
        ) : null}

        {/* Body: file tree + viewer */}
        <div className="grid min-h-0 flex-1 grid-cols-[220px_1fr]">
          <div className="overflow-y-auto border-r border-border p-2">
            {files.length === 0 && !error && (
              <p className="p-2 text-xs text-gray-500">Planning files…</p>
            )}
            {files.map((f) => (
              <button
                key={f.path}
                onClick={() => setSelected(f.path)}
                className={`block w-full truncate rounded px-2 py-1.5 text-left text-xs ${
                  f.path === selected
                    ? "bg-surface-2 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
                title={f.path}
              >
                {f.path}
              </button>
            ))}
          </div>
          <div className="min-h-0 overflow-auto bg-black/30">
            {active ? (
              <pre className="whitespace-pre p-4 text-xs leading-relaxed text-gray-200">
                {active.content}
              </pre>
            ) : (
              <div className="grid h-full place-items-center text-sm text-gray-500">
                {working ? "Generating…" : "Select a file"}
              </div>
            )}
          </div>
        </div>

        {phase === "done" && (
          <div className="border-t border-border px-4 py-2 text-xs text-gray-500">
            Starter scaffold generated. Download the zip, then build &amp;
            publish it in a later step (needs your developer accounts).
          </div>
        )}
      </div>
    </div>
  );
}
