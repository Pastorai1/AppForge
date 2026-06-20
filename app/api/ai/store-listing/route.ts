import { NextRequest } from "next/server";
import { generateJSON } from "@/lib/anthropic";
import { withQuota } from "@/lib/usage";
import type { StoreListing } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const appName: string = body.appName ?? "";
  const description: string = body.description ?? "";
  const audience: string = body.audience ?? "";

  return withQuota(async () => {
    return generateJSON<StoreListing>({
      system:
        "You are an ASO (App Store Optimization) copywriter. Write compelling, keyword-aware store listings that respect platform character limits exactly. App Store: title<=30, subtitle<=30, promotionalText<=170, description<=4000, keywords<=100 (comma-separated, no spaces). Play Store: title<=30, shortDescription<=80, fullDescription<=4000.",
      prompt: `Write App Store and Google Play listings for an app called "${appName}". What it does: ${description}. Target audience: ${audience}. Stay within every character limit.`,
      maxTokens: 3000,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["appStore", "playStore"],
        properties: {
          appStore: {
            type: "object",
            additionalProperties: false,
            required: [
              "title",
              "subtitle",
              "promotionalText",
              "description",
              "keywords",
            ],
            properties: {
              title: { type: "string" },
              subtitle: { type: "string" },
              promotionalText: { type: "string" },
              description: { type: "string" },
              keywords: { type: "string" },
            },
          },
          playStore: {
            type: "object",
            additionalProperties: false,
            required: ["title", "shortDescription", "fullDescription"],
            properties: {
              title: { type: "string" },
              shortDescription: { type: "string" },
              fullDescription: { type: "string" },
            },
          },
        },
      },
    });
  });
}
