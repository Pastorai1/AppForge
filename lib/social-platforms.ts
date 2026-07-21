/**
 * The social platforms the One-to-Many Social tool can generate for, plus
 * per-platform guidance that steers the AI. The tool generates one platform
 * at a time (fast-batch) to stay under Vercel's function timeout.
 */

export interface SocialPlatform {
  id: string;
  label: string;
  guidance: string;
}

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    id: "linkedin",
    label: "LinkedIn",
    guidance:
      "Professional but personal. Lead with a strong first line (it's the hook shown before 'see more'). Short paragraphs, generous line breaks, a story or insight, and a light call to engage (a question or soft CTA). Minimal hashtags (2-3 max). No clickbait.",
  },
  {
    id: "facebook",
    label: "Facebook",
    guidance:
      "Warm and community-oriented. Conversational tone, relatable, encourages comments and shares. A few relevant hashtags at most. Good for longer stories and community-building.",
  },
  {
    id: "instagram",
    label: "Instagram",
    guidance:
      "Visual-first. Write a scroll-stopping hook, an engaging caption, and a clear CTA. Suggest the visual format (carousel, reel, single image). Include a compact set of relevant hashtags (5-10).",
  },
  {
    id: "youtube",
    label: "YouTube (Shorts)",
    guidance:
      "Short-form video. Provide a punchy title and a 20-45 second script with a strong 3-second hook, a single clear idea, and a CTA to subscribe/learn more. Format = Short video.",
  },
  {
    id: "tiktok",
    label: "TikTok",
    guidance:
      "Short-form video. Hook in the first 2 seconds, casual and authentic voice, one idea, quick payoff. Provide a short spoken script and an on-screen text idea. A few trending-style hashtags. Format = Short video.",
  },
  {
    id: "x",
    label: "X (Twitter)",
    guidance:
      "Concise and punchy. One sharp idea per post. The caption should fit a single tweet (~280 chars) unless clearly a thread. Minimal or no hashtags.",
  },
];

export const DEFAULT_PLATFORM_IDS = ["linkedin", "facebook", "instagram"];

export function getPlatform(id: string): SocialPlatform | undefined {
  return SOCIAL_PLATFORMS.find((p) => p.id === id);
}

export function platformLabel(id: string): string {
  return getPlatform(id)?.label ?? id;
}
