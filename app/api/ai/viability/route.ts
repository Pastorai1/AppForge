import { NextRequest } from "next/server";
import { generateJSON } from "@/lib/anthropic";
import { withQuota } from "@/lib/usage";
import type { ViabilityScore } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const answers = body.answers ?? {};

  return withQuota(async () => {
    return generateJSON<ViabilityScore>({
      system:
        "You are a seasoned app investor scoring a new app idea. Be honest and rigorous — do not inflate scores. Each sub-score is 0-100. The overall score is your holistic judgement, not a simple average.",
      prompt: `Score this app idea across four dimensions: market opportunity, monetization potential, competitive edge, and build feasibility. Provide a one-line verdict, key strengths, key risks, and concrete recommendations.\n\nThe founder answered a 7-step intake:\n${JSON.stringify(
        answers,
        null,
        2,
      )}`,
      maxTokens: 2500,
      schema: {
        type: "object",
        additionalProperties: false,
        required: [
          "market",
          "monetization",
          "competitiveEdge",
          "buildFeasibility",
          "overall",
          "verdict",
          "strengths",
          "risks",
          "recommendations",
        ],
        properties: {
          market: { type: "integer" },
          monetization: { type: "integer" },
          competitiveEdge: { type: "integer" },
          buildFeasibility: { type: "integer" },
          overall: { type: "integer" },
          verdict: { type: "string" },
          strengths: { type: "array", items: { type: "string" } },
          risks: { type: "array", items: { type: "string" } },
          recommendations: { type: "array", items: { type: "string" } },
        },
      },
    });
  });
}
