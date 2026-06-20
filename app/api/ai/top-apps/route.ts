import { NextRequest } from "next/server";
import { generateJSON } from "@/lib/anthropic";
import { withQuota } from "@/lib/usage";
import type { TopApp } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const category: string = body.category ?? "All";
  const monetization: string = body.monetization ?? "All";
  // The client requests the list in small, fast batches to stay well under the
  // function time limit; `exclude` lets each batch avoid repeating earlier ones.
  const count = Math.min(Math.max(Number(body.count) || 25, 1), 40);
  const exclude: string[] = Array.isArray(body.exclude)
    ? body.exclude.slice(0, 200).map(String)
    : [];

  return withQuota(async () => {
    const filters = [
      category !== "All" ? `category "${category}"` : null,
      monetization !== "All" ? `the "${monetization}" monetization model` : null,
    ].filter(Boolean);

    const filterText =
      filters.length > 0
        ? `Focus only on apps in ${filters.join(" using ")}.`
        : "Cover a broad mix of categories and monetization models.";

    const excludeText = exclude.length
      ? ` Do NOT include any of these apps, which are already listed: ${exclude.join(", ")}.`
      : "";

    const result = await generateJSON<{ apps: TopApp[] }>({
      system:
        "You are a mobile app market analyst. You produce realistic, representative lists of top-grossing mobile apps with plausible revenue estimates. Be concrete and specific.",
      prompt: `Produce a ranked list of ${count} top-grossing mobile apps, ordered from highest to lowest gross revenue. ${filterText}${excludeText} Return ${count} apps with no duplicates. For each app give the name, its category, its primary monetization model, an estimated monthly revenue (e.g. "$4M-$6M"), and a one-line description of what it does.`,
      maxTokens: Math.min(800 + count * 90, 6000),
      // Haiku is fast — small batches return in a few seconds, avoiding timeouts.
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
