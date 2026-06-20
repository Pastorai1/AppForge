import { NextRequest } from "next/server";
import { generateJSON } from "@/lib/anthropic";
import { withQuota } from "@/lib/usage";
import type { AppAnalysis } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const name: string = body.name ?? "";
  const oneLiner: string = body.oneLiner ?? "";
  const category: string = body.category ?? "";

  return withQuota(async () => {
    return generateJSON<AppAnalysis>({
      system:
        "You are a product strategist who deconstructs successful mobile apps for indie founders. Be insightful and specific, not generic.",
      prompt: `Analyze the mobile app "${name}" (category: ${category}). Description: ${oneLiner}. Provide a concise summary, the key reasons it works, how its monetization is structured, its weaknesses, and the opportunities a new entrant could exploit.`,
      maxTokens: 2500,
      schema: {
        type: "object",
        additionalProperties: false,
        required: [
          "summary",
          "whyItWorks",
          "monetizationBreakdown",
          "weaknesses",
          "opportunities",
        ],
        properties: {
          summary: { type: "string" },
          whyItWorks: { type: "array", items: { type: "string" } },
          monetizationBreakdown: { type: "string" },
          weaknesses: { type: "array", items: { type: "string" } },
          opportunities: { type: "array", items: { type: "string" } },
        },
      },
    });
  });
}
