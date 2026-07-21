import { NextRequest } from "next/server";
import { generateChat } from "@/lib/anthropic";
import { withQuota } from "@/lib/usage";
import type { BuildMessage } from "@/lib/types";

export const maxDuration = 60;

const SYSTEM = `You are an expert interviewer who helps an expert uncover and name their signature framework — the repeatable method behind the results they get for people.

Your job in this conversation:
- Ask ONE sharp, specific question at a time to draw out HOW they actually get results: the steps they take, the order, the judgment calls, what they do that others don't, and why it works.
- Dig into specifics with follow-ups ("what exactly do you do first?", "how do you know when...?", "what would go wrong if someone skipped that?").
- Be warm, curious, and encouraging. Make them feel their expertise is valuable.
- Do not summarize or name the framework yet — that happens later. Keep pulling out the real, tacit know-how.
- Keep each message short: a brief reaction plus one question.
- Ground your questions in what you know about them (below) when helpful.`;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const brainContext: string =
    typeof body.brainContext === "string" ? body.brainContext : "";
  const messages: BuildMessage[] = Array.isArray(body.messages)
    ? body.messages
    : [];

  return withQuota(async () => {
    const system = brainContext.trim()
      ? `${SYSTEM}\n\n${brainContext.trim()}`
      : SYSTEM;

    const reply = await generateChat({
      system,
      messages: messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, content: m.content })),
      maxTokens: 1024,
    });

    return { reply };
  });
}
