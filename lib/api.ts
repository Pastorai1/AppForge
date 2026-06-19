"use client";

import type { UsageState } from "@/lib/usage";

export interface AiResult<T> {
  data: T;
  usage: UsageState | null;
}

export class AiError extends Error {
  status: number;
  upgrade: boolean;
  constructor(message: string, status: number, upgrade = false) {
    super(message);
    this.status = status;
    this.upgrade = upgrade;
  }
}

/**
 * Calls an AppForge AI route and unwraps the { data, usage } envelope.
 * Throws an `AiError` with a friendly message on failure.
 */
export async function callAi<T>(
  path: string,
  body: unknown,
): Promise<AiResult<T>> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new AiError(
      json.error ?? "Request failed.",
      res.status,
      Boolean(json.upgrade),
    );
  }

  return { data: json.data as T, usage: json.usage ?? null };
}
