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

export interface AppOpportunity {
  idea: string;
  category: string;
  pitch: string;
  why: string; // why it fits the market
  competition: string; // competition level + brief reason
  opportunityScore: number; // 0-100
  monetization: string;
}

export const BRAIN_CATEGORIES = [
  "Business",
  "Offer & Products",
  "Audience",
  "Brand Voice",
  "Story",
  "Goals",
  "Competitors",
  "Other",
] as const;

export type BrainCategory = (typeof BRAIN_CATEGORIES)[number];

export interface BrainFact {
  id: string;
  category: string;
  content: string;
  createdAt: string;
}

export type SavedItemKind = "top_app" | "opportunity";

export interface BlueprintFile {
  path: string;
  purpose: string;
}

export interface AppBlueprint {
  appName: string;
  summary: string;
  files: BlueprintFile[];
}

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface SavedItem {
  id: string;
  kind: SavedItemKind;
  itemKey: string; // stable key (lowercased name/idea) used to toggle/dedupe
  payload: TopApp | AppOpportunity;
  createdAt: string;
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

export interface SavedListing {
  id: string;
  appName: string;
  listing: StoreListing;
  createdAt: string;
}

export interface SavedMarketAnalysis {
  id: string;
  category: string;
  analysis: MarketAnalysis;
  createdAt: string;
}

export interface SavedViabilityScore {
  id: string;
  idea: string;
  score: ViabilityScore;
  createdAt: string;
}

export interface SavedTechStack {
  id: string;
  label: string;
  recommendation: TechStackRecommendation;
  createdAt: string;
}

export interface BuildMessage {
  role: "user" | "assistant";
  content: string;
}

export interface BuildSession {
  id: string;
  title: string;
  referenceApp: string | null;
  messages: BuildMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface StaffSession {
  id: string;
  title: string;
  messages: BuildMessage[];
  createdAt: string;
  updatedAt: string;
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
