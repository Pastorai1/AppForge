/**
 * Ad platforms + funnel stages for the One-to-Many Ads tool, with guidance
 * that steers the AI. Ads are generated one platform at a time (fast-batch).
 */

export interface AdPlatform {
  id: string;
  label: string;
  guidance: string;
}

export interface FunnelStage {
  id: string;
  label: string;
  guidance: string;
}

export const AD_PLATFORMS: AdPlatform[] = [
  {
    id: "meta",
    label: "Facebook / Instagram",
    guidance:
      "Meta feed ads. Strong thumb-stopping hook, benefit-led primary text (short paragraphs, occasional emoji if on-brand), a punchy headline, and a clear CTA. Creative should be scroll-stopping and native to the feed.",
  },
  {
    id: "google",
    label: "Google Search",
    guidance:
      "Responsive Search Ads. Headlines must be <= 30 characters and highly relevant to search intent; primary text acts as the description (<= 90 characters each). Focus on keywords, clarity, and the specific benefit/offer. No emoji. Creative concept = not applicable; suggest the keyword theme instead.",
  },
  {
    id: "youtube",
    label: "YouTube",
    guidance:
      "Skippable in-stream video ads. The hook must land in the first 5 seconds before the skip. Primary text = a short 15-30 second script. Headline = the companion banner line. Creative concept = what the video shows.",
  },
  {
    id: "tiktok",
    label: "TikTok",
    guidance:
      "Native-feeling short video ads. Authentic, creator-style, hook in the first 2 seconds. Primary text = a short spoken script + on-screen text idea. Avoid a polished-corporate feel. Creative concept = the video idea.",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    guidance:
      "Professional sponsored content. Credibility and clear business value. Hook to a specific professional pain/outcome, concise primary text, professional headline, and a clear CTA. Creative concept = a clean, professional visual.",
  },
];

export const FUNNEL_STAGES: FunnelStage[] = [
  {
    id: "awareness",
    label: "Awareness (top of funnel)",
    guidance:
      "The audience is cold and does not know the brand. Lead with the problem, a relatable story, or a bold insight. Educate and intrigue; do NOT hard-sell. CTA is soft (learn more, watch, read).",
  },
  {
    id: "consideration",
    label: "Consideration (middle of funnel)",
    guidance:
      "The audience knows they have the problem and is weighing options. Show how the product solves it, differentiate, add proof or specifics, and handle objections. CTA invites a deeper step (start free trial, see how it works).",
  },
  {
    id: "conversion",
    label: "Conversion (bottom of funnel)",
    guidance:
      "The audience is ready to decide. Be direct: the offer, the outcome, urgency/risk-reversal where honest, and a strong CTA to buy/subscribe/start now.",
  },
];

export const DEFAULT_AD_PLATFORM_IDS = ["meta"];

export function getAdPlatform(id: string): AdPlatform | undefined {
  return AD_PLATFORMS.find((p) => p.id === id);
}

export function adPlatformLabel(id: string): string {
  return getAdPlatform(id)?.label ?? id;
}

export function getFunnelStage(id: string): FunnelStage {
  return FUNNEL_STAGES.find((s) => s.id === id) ?? FUNNEL_STAGES[0];
}

export function funnelStageLabel(id: string): string {
  return getFunnelStage(id).label;
}
