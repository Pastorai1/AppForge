import { NextRequest } from "next/server";
import { generateText } from "@/lib/anthropic";
import { withQuota } from "@/lib/usage";
import type { BlueprintFile } from "@/lib/types";

export const maxDuration = 60;

/** Remove accidental ``` fences if the model wraps the file in markdown. */
function stripFences(text: string): string {
  let t = text.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```[a-zA-Z0-9]*\n?/, "").replace(/\n?```$/, "");
  }
  return t.trim() + "\n";
}

/**
 * Step 2 of app generation: write a single file's contents. Uses Haiku with a
 * tight budget so each request stays well under the function time limit; the
 * client calls this once per blueprint file and assembles the project.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const appName: string = body.appName ?? "App";
  const summary: string = body.summary ?? "";
  const files: BlueprintFile[] = Array.isArray(body.files) ? body.files : [];
  const path: string = body.path ?? "";
  const purpose: string = body.purpose ?? "";

  return withQuota(async () => {
    const manifest = files.map((f) => `- ${f.path}: ${f.purpose}`).join("\n");

    const content = await generateText({
      system:
        "You are a senior React Native engineer writing a minimal, runnable Expo (TypeScript) MVP. Write clean, concise, COMPLETE files. Keep each file minimal — no over-engineering, no placeholder TODOs that break compilation. Output ONLY the raw file contents: no markdown fences, no explanation.",
      prompt: `App: ${appName} (Expo, React Native, TypeScript${
        manifest.includes("navigation") || manifest.includes("App.tsx")
          ? ", React Navigation"
          : ""
      }).
Summary: ${summary}

Project files:
${manifest}

Write the COMPLETE contents of this one file only:
${path} — ${purpose}

Keep it concise and self-contained so the project stays runnable. Output only the file contents for ${path}.`,
      maxTokens: 2600,
    });

    return { path, content: stripFences(content) };
  });
}
