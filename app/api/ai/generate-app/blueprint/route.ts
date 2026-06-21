import { NextRequest } from "next/server";
import { generateJSON } from "@/lib/anthropic";
import { withQuota } from "@/lib/usage";
import type { AppBlueprint } from "@/lib/types";

export const maxDuration = 60;

/**
 * Step 1 of app generation: turn a Build-coach plan into a file blueprint for a
 * minimal, runnable Expo (React Native + TypeScript) MVP. Kept small (≤ 8
 * files) so the follow-up per-file generation stays fast and reliable.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const plan: string =
    typeof body.plan === "string" ? body.plan.slice(0, 12000) : "";

  return withQuota(async () => {
    const result = await generateJSON<AppBlueprint>({
      system:
        "You are a senior React Native engineer. You design minimal, runnable Expo (TypeScript) MVP apps with a clean, conventional structure.",
      prompt: `Based on the following app plan, design a minimal but runnable Expo (React Native, TypeScript) MVP.

PLAN:
${plan || "A simple, useful mobile app. Infer a sensible MVP."}

List 6-8 files MAX that form a coherent, runnable starter: package.json, app.json, App.tsx (with navigation), a theme/constants file, 2-4 screens implementing the core features, and a README with run instructions. Prefer fewer, focused files. For each file give its path and a one-line purpose. Also give the app a short name (PascalCase, no spaces) and a one-sentence summary.`,
      maxTokens: 1500,
      model: "claude-sonnet-4-6",
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["appName", "summary", "files"],
        properties: {
          appName: { type: "string" },
          summary: { type: "string" },
          files: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["path", "purpose"],
              properties: {
                path: { type: "string" },
                purpose: { type: "string" },
              },
            },
          },
        },
      },
    });

    // Hard cap to keep total generation time bounded.
    result.files = (result.files ?? []).slice(0, 8);
    return result;
  });
}
