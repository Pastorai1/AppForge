import { NextRequest } from "next/server";
import { generateText } from "@/lib/anthropic";
import { withQuota } from "@/lib/usage";

const LIMITS: Record<string, number> = {
  title: 30,
  subtitle: 30,
  promotionalText: 170,
  description: 4000,
  keywords: 100,
  shortDescription: 80,
  fullDescription: 4000,
};

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const field: string = body.field ?? "";
  const current: string = body.current ?? "";
  const appName: string = body.appName ?? "";
  const limit = LIMITS[field] ?? 200;

  return withQuota(async () => {
    const text = await generateText({
      system:
        "You are an ASO copywriter. Rewrite a single store-listing field to be sharper and more compelling. Respond with ONLY the rewritten text — no quotes, no preamble, no explanation. Never exceed the character limit given.",
      prompt: `App: "${appName}". Field: "${field}" (max ${limit} characters). Current text:\n"${current}"\n\nRewrite it.`,
      maxTokens: 1024,
    });

    // Hard safety clamp in case the model overshoots the limit.
    return { text: text.slice(0, limit) };
  });
}
