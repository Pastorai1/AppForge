import { NextRequest } from "next/server";
import { generateJSON } from "@/lib/anthropic";
import { withQuota } from "@/lib/usage";
import type { TopApp } from "@/lib/types";

// A 100-item list takes longer than the default function budget — give it room.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const category: string = body.category ?? "All";
  const monetization: string = body.monetization ?? "All";

  return withQuota(async () => {
    const filters = [
      category !== "All" ? `category "${category}"` : null,
      monetization !== "All" ? `the "${monetization}" monetization model` : null,
    ].filter(Boolean);

    const filterText =
      filters.length > 0
        ? `Focus only on apps in ${filters.join(" using ")}.`
        : "Cover a broad mix of categories and monetization models.";

    const result = await generateJSON<{ apps: TopApp[] }>({
      system:
        "You are a mobile app market analyst. You produce realistic, representative lists of top-grossing mobile apps with plausible revenue estimates. Be concrete and specific.",
      prompt: `Produce a ranked list of the top 100 top-grossing mobile apps, ordered from highest to lowest gross revenue. ${filterText} Return as many as you can up to 100, with no duplicates. For each app give the name, its category, its primary monetization model, an estimated monthly revenue (e.g. "$4M-$6M"), and a one-line description of what it does.`,
      maxTokens: 12000,
      // Haiku is several times faster than Opus — a 100-item list of well-known
      // apps doesn't need Opus, and the speed avoids function timeouts.
      model: "claude-haiku-4-5",
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["apps"],
        properties: {
          apps: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: [
                "name",
                "category",
                "monetization",
                "estMonthlyRevenue",
                "oneLiner",
              ],
              properties: {
                name: { type: "string" },
                category: { type: "string" },
                monetization: { type: "string" },
                estMonthlyRevenue: { type: "string" },
                oneLiner: { type: "string" },
              },
            },
          },
        },
      },
    });

    return result.apps;
  });
}
