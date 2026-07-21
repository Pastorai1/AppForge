import type { AttractiveCharacter, CharacterProfile } from "@/lib/types";

/**
 * Server-side (de)serialization helpers shared by the /api/characters routes.
 * A character row stores its label in `name` and the profile fields in a
 * `payload` jsonb column.
 */

export const CHARACTER_COLUMNS = "id, name, payload, created_at, updated_at";

const PROFILE_FIELDS: (keyof CharacterProfile)[] = [
  "identity",
  "backstory",
  "voice",
  "audience",
  "signaturePhrases",
  "avoid",
];

export function toCharacter(row: {
  id: string;
  name: string;
  payload: Partial<CharacterProfile> | null;
  created_at: string;
  updated_at: string;
}): AttractiveCharacter {
  const p = row.payload ?? {};
  return {
    id: row.id,
    name: row.name,
    identity: p.identity ?? "",
    backstory: p.backstory ?? "",
    voice: p.voice ?? "",
    audience: p.audience ?? "",
    signaturePhrases: p.signaturePhrases ?? "",
    avoid: p.avoid ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Pulls just the profile fields out of a request body. */
export function profileFromBody(
  body: Record<string, unknown>,
): Partial<CharacterProfile> {
  const out: Partial<CharacterProfile> = {};
  for (const key of PROFILE_FIELDS) {
    if (typeof body[key] === "string") out[key] = (body[key] as string).trim();
  }
  return out;
}
