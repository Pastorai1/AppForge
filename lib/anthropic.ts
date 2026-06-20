import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { env, isAnthropicConfigured } from "@/lib/env";

/**
 * Server-only Anthropic helpers. This module imports `server-only`, so any
 * accidental import from a Client Component is a build-time error — the API
 * key can never reach the browser.
 */

// Default to the latest, most capable Claude model.
export const MODEL = "claude-opus-4-8";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: env.anthropicKey });
  }
  return client;
}

export class AnthropicNotConfiguredError extends Error {
  constructor() {
    super("Anthropic API key is not configured.");
    this.name = "AnthropicNotConfiguredError";
  }
}

type JsonSchema = Record<string, unknown>;

/**
 * Generate a structured JSON object that conforms to `schema`.
 *
 * Uses Opus 4.8 structured outputs (`output_config.format`) so the response is
 * guaranteed to be valid JSON matching the schema — no brittle string parsing.
 */
export async function generateJSON<T>(opts: {
  system: string;
  prompt: string;
  schema: JsonSchema;
  maxTokens?: number;
  effort?: "low" | "medium" | "high" | "xhigh" | "max";
}): Promise<T> {
  if (!isAnthropicConfigured()) {
    throw new AnthropicNotConfiguredError();
  }

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: opts.maxTokens ?? 4096,
    system: opts.system,
    output_config: {
      ...(opts.effort ? { effort: opts.effort } : {}),
      format: {
        type: "json_schema",
        schema: opts.schema,
      },
    },
    messages: [{ role: "user", content: opts.prompt }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("The model declined to answer this request.");
  }

  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") {
    throw new Error("No content returned from the model.");
  }

  return JSON.parse(text.text) as T;
}

/**
 * Generate free-form text (used for single-field rewrites).
 */
export async function generateText(opts: {
  system: string;
  prompt: string;
  maxTokens?: number;
}): Promise<string> {
  if (!isAnthropicConfigured()) {
    throw new AnthropicNotConfiguredError();
  }

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: opts.maxTokens ?? 1024,
    system: opts.system,
    messages: [{ role: "user", content: opts.prompt }],
  });

  const text = response.content.find((b) => b.type === "text");
  return text && text.type === "text" ? text.text.trim() : "";
}
