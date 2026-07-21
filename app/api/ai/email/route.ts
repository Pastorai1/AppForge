import { NextRequest } from "next/server";
import { generateJSON } from "@/lib/anthropic";
import { withQuota } from "@/lib/usage";

// One email per request keeps us well under the function timeout.
export const maxDuration = 60;

const SYSTEM = `You are an expert direct-response email copywriter trained in Russell Brunson's frameworks (Soap Opera and Seinfeld sequences). You write one email at a time as part of a larger sequence.

Rules:
- Write in the provided character's voice. Match their tone exactly. Honest and human — never hypey, spammy, or manipulative.
- Ground the content in the provided business context. Do not invent facts that contradict it.
- Write a compelling subject line (under ~60 characters) and a complete, ready-to-send email body.
- The body should be well-formatted plain text with short paragraphs and a clear call to action where appropriate. Use a greeting and a sign-off. Do not use markdown headers or asterisks.
- Do NOT repeat subject lines already used earlier in the sequence.`;

interface EmailBody {
  topic?: string;
  sequenceLabel?: string;
  stepPurpose?: string;
  stepInstruction?: string;
  position?: number;
  total?: number;
  brainContext?: string;
  characterVoice?: string;
  priorSubjects?: string[];
}

export async function POST(req: NextRequest) {
  const body: EmailBody = await req.json().catch(() => ({}));
  const topic = typeof body.topic === "string" ? body.topic.trim() : "";
  const sequenceLabel = body.sequenceLabel ?? "email sequence";
  const stepPurpose = body.stepPurpose ?? "";
  const stepInstruction = body.stepInstruction ?? "";
  const position = Number(body.position) || 1;
  const total = Number(body.total) || 1;
  const brainContext =
    typeof body.brainContext === "string" ? body.brainContext : "";
  const characterVoice =
    typeof body.characterVoice === "string" ? body.characterVoice : "";
  const priorSubjects = Array.isArray(body.priorSubjects)
    ? body.priorSubjects.filter((s) => typeof s === "string")
    : [];

  return withQuota(async () => {
    const prompt = `Write email ${position} of ${total} in a "${sequenceLabel}".

This email's job — ${stepPurpose}: ${stepInstruction}

What the sequence is promoting / about:
${topic || "(the founder's product/offer — infer from the business context below)"}

${characterVoice || "Write in an honest, warm, no-hype voice."}

${brainContext || "No saved business context was provided; write sensible, on-brand copy."}

${
  priorSubjects.length
    ? `Subject lines already used earlier in this sequence (do NOT reuse or closely echo these):\n- ${priorSubjects.join(
        "\n- ",
      )}`
    : ""
}

Return a subject line and the full email body.`;

    return generateJSON<{ subject: string; body: string }>({
      system: SYSTEM,
      prompt,
      maxTokens: 1400,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["subject", "body"],
        properties: {
          subject: { type: "string" },
          body: { type: "string" },
        },
      },
    });
  });
}
