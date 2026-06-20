// Shared domain types for AppForge.

export type Category =
  | "Health & Fitness"
  | "Finance"
  | "Productivity"
  | "Education"
  | "Social"
  | "Games"
  | "Lifestyle"
  | "Business"
  | "Photo & Video"
  | "Travel";

export const CATEGORIES: Category[] = [
  "Health & Fitness",
  "Finance",
  "Productivity",
  "Education",
  "Social",
  "Games",
  "Lifestyle",
  "Business",
  "Photo & Video",
  "Travel",
];

export type Monetization =
  | "Subscription"
  | "Freemium"
  | "Paid"
  | "Ads"
  | "In-App Purchases";

export const MONETIZATIONS: Monetization[] = [
  "Subscription",
  "Freemium",
  "Paid",
  "Ads",
  "In-App Purchases",
];

export interface TopApp {
  name: string;
  category: string;
  monetization: string;
  estMonthlyRevenue: string;
  oneLiner: string;
}

export interface AppAnalysis {
  summary: string;
  whyItWorks: string[];
  monetizationBreakdown: string;
  weaknesses: string[];
  opportunities: string[];
}

export interface MarketNiche {
  name: string;
  score: number; // 0-100
  rationale: string;
}

export interface MarketAnalysis {
  marketSize: string;
  growth: string;
  competition: string;
  summary: string;
  niches: MarketNiche[];
}

export interface ViabilityScore {
  market: number; // 0-100
  monetization: number;
  competitiveEdge: number;
  buildFeasibility: number;
  overall: number;
  verdict: string;
  strengths: string[];
  risks: string[];
  recommendations: string[];
}

export interface StoreListing {
  appStore: {
    title: string; // <= 30
    subtitle: string; // <= 30
    promotionalText: string; // <= 170
    description: string; // <= 4000
    keywords: string; // <= 100
  };
  playStore: {
    title: string; // <= 30
    shortDescription: string; // <= 80
    fullDescription: string; // <= 4000
  };
}

export interface TechStackRecommendation {
  recommended: {
    name: string;
    rationale: string;
  };
  alternatives: { name: string; whenToUse: string }[];
  roadmap: { step: string; detail: string }[];
}

export type ProjectStage = "Scoping" | "Building" | "Review" | "Live";

export const PROJECT_STAGES: ProjectStage[] = [
  "Scoping",
  "Building",
  "Review",
  "Live",
];

export interface Project {
  id: string;
  title: string;
  description: string;
  stage: ProjectStage;
  score: number | null;
}
