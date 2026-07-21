import { NextRequest } from "next/server";
import { generateJSON } from "@/lib/anthropic";
import { withQuota } from "@/lib/usage";
import type { BuildMessage, ExtractedFramework } from "@/lib/types";

export const maxDuration = 60;

const SYSTEM = `You are a framework strategist. From an interview transcript, you distill the expert's tacit know-how into a clear, named, teachable signature framework.

Rules:
- Base the framework on what the expert actually said. Do not invent steps they never described; you may clarify and organize.
- Give it a memorable, benefit-oriented NAME (and a short tagline). Name the steps so they're easy to remember (a clear sequence; a light acronym or parallel naming is welcome if it fits naturally — never force it).
- Each step needs a clear description of what to do and why it matters.
- The "teaching" field explains how they could teach, package, or sell this framework (course, talk, lead magnet, service).
- Keep it honest and grounded — no hype.`;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const brainContext: string =
    typeof body.brainContext === "string" ? body.brainContext : "";
  const messages: BuildMessage[] = Array.isArray(body.messages)
    ? body.messages
    : [];

  const transcript = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => `${m.role === "user" ? "Expert" : "Interviewer"}: ${m.content}`)
    .join("\n\n");

  return withQuota(async () => {
    const prompt = `From this interview, extract and structure the expert's signature framework.

${brainContext ? `${brainContext}\n\n` : ""}Interview transcript:
${transcript || "(no transcript provided — infer a sensible starting framework from the business context above)"}

Return the framework: name, tagline, promise, ordered steps (each with name + description), and how to teach/package/sell it.`;

    return generateJSON<ExtractedFramework>({
      system: SYSTEM,
      prompt,
      maxTokens: 2200,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["name", "tagline", "promise", "steps", "teaching"],
        properties: {
          name: { type: "string" },
          tagline: { type: "string" },
          promise: { type: "string" },
          steps: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["name", "description"],
              properties: {
                name: { type: "string" },
                description: { type: "string" },
              },
            },
          },
          teaching: { type: "string" },
        },
      },
    });
  });
}
