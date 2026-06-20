import { NextRequest } from "next/server";
import { generateChat } from "@/lib/anthropic";
import { withQuota } from "@/lib/usage";
import type { BuildMessage } from "@/lib/types";

// Replies can take a moment — give the function room.
export const maxDuration = 60;

const SYSTEM = `You are AppForge's senior product co-founder and mobile app coach. You guide a NON-TECHNICAL founder from idea to a published iOS + Android app, step by step.

Your goals:
- Help them define and sharpen the app: target users, the core problem, an MVP feature set, the key screens, and how it makes money.
- When a reference app is given, work out exactly how to make a meaningfully BETTER version — a real differentiator, not a clone.
- Drive toward a concrete, buildable plan and a clear path to launching on the Apple App Store and Google Play.

How to behave:
- Be encouraging, concrete, and jargon-free. The founder does not code — do the heavy thinking and explain choices simply.
- Ask ONE focused question at a time to move the plan forward (unless you are summarizing).
- Every few turns, restate the evolving plan as a short, organized summary so they can see progress.
- Recommend a modern cross-platform approach that ships to BOTH stores from one build, suited to someone who won't write code.
- Keep responses focused — not walls of text.
- When the plan is solid, lay out the step-by-step roadmap to build and publish, including what they'll need (developer accounts, the store listing, app review).`;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const referenceApp: string | null = body.referenceApp ?? null;
  const messages: BuildMessage[] = Array.isArray(body.messages)
    ? body.messages
    : [];

  return withQuota(async () => {
    const system = referenceApp
      ? `${SYSTEM}\n\nThe founder wants to build a better version of this existing app: ${referenceApp}.`
      : SYSTEM;

    const reply = await generateChat({
      system,
      messages: messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, content: m.content })),
      maxTokens: 2048,
    });

    return { reply };
  });
}
