import { NextRequest } from "next/server";
import { generateJSON } from "@/lib/anthropic";
import { withQuota } from "@/lib/usage";

// One section per request keeps us under the function timeout.
export const maxDuration = 60;

const SYSTEM = `You are an expert presentation and webinar scriptwriter trained in Russell Brunson's Perfect Webinar framework. You write ONE section of a sales presentation at a time, keeping it consistent with the sections already written.

Rules:
- Write in the provided character's voice. Match their tone exactly. Honest and human — never hypey, deceptive, or manipulative. No fake urgency or false claims.
- Ground everything in the provided business context. Do not invent facts that contradict it.
- Stay consistent with the earlier sections summarized for you (same story, same offer, same promise).
- Write ready-to-deliver script/talking points for this section — natural spoken language, well-structured, not bullet fragments only. No markdown headers or asterisks.`;

interface PresentationBody {
  sectionTitle?: string;
  sectionInstruction?: string;
  position?: number;
  total?: number;
  topic?: string;
  priorContext?: string;
  brainContext?: string;
  characterVoice?: string;
}

export async function POST(req: NextRequest) {
  const body: PresentationBody = await req.json().catch(() => ({}));
  const sectionTitle = body.sectionTitle ?? "section";
  const sectionInstruction = body.sectionInstruction ?? "";
  const position = Number(body.position) || 1;
  const total = Number(body.total) || 1;
  const topic = typeof body.topic === "string" ? body.topic.trim() : "";
  const priorContext =
    typeof body.priorContext === "string" ? body.priorContext : "";
  const brainContext =
    typeof body.brainContext === "string" ? body.brainContext : "";
  const characterVoice =
    typeof body.characterVoice === "string" ? body.characterVoice : "";

  return withQuota(async () => {
    const prompt = `Write section ${position} of ${total} of a Perfect Webinar-style sales presentation.

This section — "${sectionTitle}": ${sectionInstruction}

What is being sold / the transformation offered:
${topic || "(the founder's offer — infer from the business context below)"}

${characterVoice || "Write in an honest, warm, no-hype voice."}

${brainContext || "No saved business context was provided; write sensible, on-brand content."}

${
  priorContext
    ? `Sections already written (stay consistent with these — same story, promise, and offer):\n${priorContext}`
    : ""
}

Return the script content for this section only.`;

    return generateJSON<{ content: string }>({
      system: SYSTEM,
      prompt,
      maxTokens: 1600,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["content"],
        properties: {
          content: { type: "string" },
        },
      },
    });
  });
}
