import { NextRequest } from "next/server";
import { generateJSON } from "@/lib/anthropic";
import { withQuota } from "@/lib/usage";
import type { MarketAnalysis } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const category: string = body.category ?? "Productivity";

  return withQuota(async () => {
    return generateJSON<MarketAnalysis>({
      system:
        "You are a mobile app market analyst. Provide grounded, specific assessments with plausible figures. Rank niches by opportunity for an indie developer.",
      prompt: `Analyze the "${category}" mobile app market. Cover the overall market size, growth trajectory, and the competitive landscape. Then identify 5 specific sub-niches, score each from 0-100 on opportunity for a small new entrant, and explain the rationale for each score.`,
      maxTokens: 3000,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["marketSize", "growth", "competition", "summary", "niches"],
        properties: {
          marketSize: { type: "string" },
          growth: { type: "string" },
          competition: { type: "string" },
          summary: { type: "string" },
          niches: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["name", "score", "rationale"],
              properties: {
                name: { type: "string" },
                score: { type: "integer" },
                rationale: { type: "string" },
              },
            },
          },
        },
      },
    });
  });
}
