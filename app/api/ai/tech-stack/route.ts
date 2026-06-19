import { NextRequest } from "next/server";
import { generateJSON } from "@/lib/anthropic";
import { withQuota } from "@/lib/usage";
import type { TechStackRecommendation } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const answers = body.answers ?? {};

  return withQuota(async () => {
    return generateJSON<TechStackRecommendation>({
      system:
        "You are a pragmatic mobile engineering lead recommending a tech stack for a new app. Recommend the single best primary framework, give credible alternatives with when-to-use guidance, and a concrete getting-started roadmap.",
      prompt: `Recommend a mobile app tech stack based on these answers:\n${JSON.stringify(
        answers,
        null,
        2,
      )}`,
      maxTokens: 2500,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["recommended", "alternatives", "roadmap"],
        properties: {
          recommended: {
            type: "object",
            additionalProperties: false,
            required: ["name", "rationale"],
            properties: {
              name: { type: "string" },
              rationale: { type: "string" },
            },
          },
          alternatives: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["name", "whenToUse"],
              properties: {
                name: { type: "string" },
                whenToUse: { type: "string" },
              },
            },
          },
          roadmap: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["step", "detail"],
              properties: {
                step: { type: "string" },
                detail: { type: "string" },
              },
            },
          },
        },
      },
    });
  });
}
