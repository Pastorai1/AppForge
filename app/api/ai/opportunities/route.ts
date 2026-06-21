import { NextRequest } from "next/server";
import { generateJSON } from "@/lib/anthropic";
import { withQuota } from "@/lib/usage";
import type { AppOpportunity } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const category: string = body.category ?? "All";
  // Small, fast batches; the client requests several and appends them.
  const count = Math.min(Math.max(Number(body.count) || 12, 1), 15);
  const exclude: string[] = Array.isArray(body.exclude)
    ? body.exclude.slice(0, 150).map(String)
    : [];

  return withQuota(async () => {
    const focus =
      category !== "All"
        ? `Focus on the "${category}" category.`
        : "Span a broad mix of categories.";
    const excludeText = exclude.length
      ? ` Do NOT repeat any of these already-suggested ideas: ${exclude.join("; ")}.`
      : "";

    const result = await generateJSON<{ ideas: AppOpportunity[] }>({
      system:
        "You are a mobile app market strategist who finds underserved, buildable app opportunities. You weigh real market demand against current competition and favor ideas a small indie team could realistically build and monetize. Be specific and realistic — no vague or joke ideas.",
      prompt: `Recommend ${count} specific mobile app ideas that are great opportunities to BUILD right now, chosen for strong market fit and beatable competition. ${focus}${excludeText} Keep every field SHORT: pitch ≤ 1 sentence; why ≤ 12 words; competition ≤ 10 words (e.g. "Low — few focused players"); monetization ≤ 8 words. Give a 0-100 opportunityScore (higher = better opportunity). Rank highest score first. Return ${count} distinct ideas.`,
      maxTokens: Math.min(400 + count * 120, 3000),
      // Haiku keeps each batch fast enough to avoid function timeouts.
      model: "claude-haiku-4-5",
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["ideas"],
        properties: {
          ideas: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: [
                "idea",
                "category",
                "pitch",
                "why",
                "competition",
                "opportunityScore",
                "monetization",
              ],
              properties: {
                idea: { type: "string" },
                category: { type: "string" },
                pitch: { type: "string" },
                why: { type: "string" },
                competition: { type: "string" },
                opportunityScore: { type: "integer" },
                monetization: { type: "string" },
              },
            },
          },
        },
      },
    });

    return result.ideas;
  });
}
