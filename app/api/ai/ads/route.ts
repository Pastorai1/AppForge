import { NextRequest } from "next/server";
import { generateJSON } from "@/lib/anthropic";
import { withQuota } from "@/lib/usage";

// One platform's batch per request keeps us under the function timeout.
export const maxDuration = 60;

const SYSTEM = `You are an expert direct-response advertising copywriter. You produce a batch of high-converting ad variations for ONE platform and ONE funnel stage at a time.

Rules:
- Write in the provided character's voice. Match their tone exactly. Honest and human — never hypey, deceptive, or manipulative. No fake urgency or unverifiable claims.
- Ground every ad in the provided business context. Do not invent facts that contradict it.
- Respect the funnel stage: match the reader's awareness and intent.
- Make each ad variation genuinely distinct — different angles and hooks, not reworded copies.
- Each ad needs: hook (the opener), headline (short), primaryText (main body), cta (call to action), and creativeConcept (the visual/creative idea, or the keyword theme where visuals don't apply).
- Follow the platform's format constraints. No markdown or asterisks.`;

interface AdsBody {
  platformLabel?: string;
  platformGuidance?: string;
  stageLabel?: string;
  stageGuidance?: string;
  count?: number;
  topic?: string;
  brainContext?: string;
  characterVoice?: string;
}

export async function POST(req: NextRequest) {
  const body: AdsBody = await req.json().catch(() => ({}));
  const platformLabel = body.platformLabel ?? "the platform";
  const platformGuidance = body.platformGuidance ?? "";
  const stageLabel = body.stageLabel ?? "";
  const stageGuidance = body.stageGuidance ?? "";
  const count = Math.min(Math.max(Number(body.count) || 4, 1), 8);
  const topic = typeof body.topic === "string" ? body.topic.trim() : "";
  const brainContext =
    typeof body.brainContext === "string" ? body.brainContext : "";
  const characterVoice =
    typeof body.characterVoice === "string" ? body.characterVoice : "";

  return withQuota(async () => {
    const prompt = `Create ${count} distinct ${platformLabel} ad variations for the ${stageLabel} stage.

Platform — ${platformLabel}: ${platformGuidance}

Funnel stage — ${stageLabel}: ${stageGuidance}

What's being advertised (offer/product):
${topic || "(the founder's product/offer — infer from the business context below)"}

${characterVoice || "Write in an honest, warm, no-hype voice."}

${brainContext || "No saved business context was provided; write sensible, on-brand ads."}

Return ${count} ad variations. Each must have: hook, headline, primaryText, cta, creativeConcept.`;

    return generateJSON<{
      ads: {
        hook: string;
        headline: string;
        primaryText: string;
        cta: string;
        creativeConcept: string;
      }[];
    }>({
      system: SYSTEM,
      prompt,
      maxTokens: 2200,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["ads"],
        properties: {
          ads: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: [
                "hook",
                "headline",
                "primaryText",
                "cta",
                "creativeConcept",
              ],
              properties: {
                hook: { type: "string" },
                headline: { type: "string" },
                primaryText: { type: "string" },
                cta: { type: "string" },
                creativeConcept: { type: "string" },
              },
            },
          },
        },
      },
    });
  });
}
