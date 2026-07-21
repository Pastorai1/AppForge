import { NextRequest } from "next/server";
import { generateJSON } from "@/lib/anthropic";
import { withQuota } from "@/lib/usage";

// One platform's batch per request keeps us under the function timeout.
export const maxDuration = 60;

const SYSTEM = `You are an expert social media strategist and copywriter. You create a batch of ready-to-post content for ONE platform at a time, tailored to how that platform actually works.

Rules:
- Write in the provided character's voice. Match their tone exactly. Honest and human — never hypey, spammy, or manipulative.
- Ground every post in the provided business context. Do not invent facts that contradict it.
- Make each post distinct — different angles, hooks, and formats. Do not repeat the same idea.
- Each post needs: a scroll-stopping hook (opening line), a complete caption/script ready to post, suggested hashtags (empty string if the platform doesn't need them), and a suggested format.
- No markdown headers or asterisks in the caption.`;

interface SocialBody {
  platformLabel?: string;
  platformGuidance?: string;
  count?: number;
  topic?: string;
  brainContext?: string;
  characterVoice?: string;
}

export async function POST(req: NextRequest) {
  const body: SocialBody = await req.json().catch(() => ({}));
  const platformLabel = body.platformLabel ?? "social media";
  const platformGuidance = body.platformGuidance ?? "";
  const count = Math.min(Math.max(Number(body.count) || 5, 1), 10);
  const topic = typeof body.topic === "string" ? body.topic.trim() : "";
  const brainContext =
    typeof body.brainContext === "string" ? body.brainContext : "";
  const characterVoice =
    typeof body.characterVoice === "string" ? body.characterVoice : "";

  return withQuota(async () => {
    const prompt = `Create ${count} distinct ${platformLabel} posts.

Platform guidance — ${platformLabel}: ${platformGuidance}

Theme / what to post about:
${topic || "(the founder's product, story, and audience — infer from the business context below)"}

${characterVoice || "Write in an honest, warm, no-hype voice."}

${brainContext || "No saved business context was provided; write sensible, on-brand posts."}

Return ${count} posts. Each must have: hook, caption, hashtags (empty string if not needed), and format.`;

    return generateJSON<{
      posts: {
        hook: string;
        caption: string;
        hashtags: string;
        format: string;
      }[];
    }>({
      system: SYSTEM,
      prompt,
      maxTokens: 2200,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["posts"],
        properties: {
          posts: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["hook", "caption", "hashtags", "format"],
              properties: {
                hook: { type: "string" },
                caption: { type: "string" },
                hashtags: { type: "string" },
                format: { type: "string" },
              },
            },
          },
        },
      },
    });
  });
}
