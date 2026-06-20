import { NextRequest } from "next/server";
import { generateJSON } from "@/lib/anthropic";
import { withQuota } from "@/lib/usage";
import type { TopApp } from "@/lib/types";

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
      prompt: `Produce a list of 12 top-grossing mobile apps. ${filterText} For each app give the name, its category, its primary monetization model, an estimated monthly revenue (e.g. "$4M-$6M"), and a one-line description of what it does.`,
      maxTokens: 3000,
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
