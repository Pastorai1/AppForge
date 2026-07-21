import { NextRequest } from "next/server";
import { generateJSON } from "@/lib/anthropic";
import { withQuota } from "@/lib/usage";
import type { CharacterProfile } from "@/lib/types";

// Give the model room; this is a single structured generation.
export const maxDuration = 60;

const SYSTEM = `You are a brand-voice strategist trained in Russell Brunson's "Attractive Character" framework. You turn what you know about a founder and their business into a reusable voice profile that content tools (emails, social, ads) can write in.

The Attractive Character has four elements you should weave in: a backstory (origin + why they do this), relatable identity, a clear voice/tone, and the audience they speak to. Keep everything honest and specific — no hype, no manipulation. Ground every field in the provided context; do not invent facts that contradict it. If context is thin, write sensible, on-brand starting points the founder can refine.`;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const brainContext: string =
    typeof body.brainContext === "string" ? body.brainContext : "";
  const seed: string = typeof body.seed === "string" ? body.seed.trim() : "";

  return withQuota(async () => {
    const prompt = `Draft an Attractive Character voice profile.${
      seed ? `\n\nWhat this character is for: ${seed}` : ""
    }${
      brainContext
        ? `\n\n${brainContext}`
        : "\n\nNo saved business context was provided — write a strong, honest, no-hype default the founder can refine."
    }

Return each field as a few concise sentences (or a short comma-separated list where noted):
- identity: who this character is and the role/identity they embody for the audience.
- backstory: their origin story and why they do this work.
- voice: how the writing should sound — tone, style, rhythm.
- audience: who they speak to, in their language.
- signaturePhrases: words, phrases, or hooks to lean on (comma-separated).
- avoid: words, claims, or tactics to avoid (comma-separated).`;

    return generateJSON<CharacterProfile>({
      system: SYSTEM,
      prompt,
      maxTokens: 1800,
      schema: {
        type: "object",
        additionalProperties: false,
        required: [
          "identity",
          "backstory",
          "voice",
          "audience",
          "signaturePhrases",
          "avoid",
        ],
        properties: {
          identity: { type: "string" },
          backstory: { type: "string" },
          voice: { type: "string" },
          audience: { type: "string" },
          signaturePhrases: { type: "string" },
          avoid: { type: "string" },
        },
      },
    });
  });
}
