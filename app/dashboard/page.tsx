import Link from "next/link";
import { PageHeader } from "@/components/ui";

const TILES = [
  {
    href: "/dashboard/top-apps",
    title: "Top 100 Apps Explorer",
    body: "Browse AI-ranked top-grossing apps and dig into what makes them work.",
  },
  {
    href: "/dashboard/market-analysis",
    title: "Market Analysis",
    body: "Size up a category: market, growth, competition, and ranked niches.",
  },
  {
    href: "/dashboard/viability",
    title: "Viability Scorer",
    body: "Score an idea across market, monetization, edge, and feasibility.",
  },
  {
    href: "/dashboard/projects",
    title: "Projects Kanban",
    body: "Track ideas from Scoping → Building → Review → Live.",
  },
  {
    href: "/dashboard/store-listing",
    title: "Store Listing Generator",
    body: "Generate App Store + Play Store copy with live counters and rewrites.",
  },
  {
    href: "/dashboard/tech-stack",
    title: "Tech Stack Recommender",
    body: "Answer 5 questions, get a stack, alternatives, and a roadmap.",
  },
];

export default function DashboardHome() {
  return (
    <div>
      <PageHeader
        title="Welcome to AppForge"
        subtitle="Your AI-powered app studio. Pick a tool to get started."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TILES.map((t) => (
          <Link key={t.href} href={t.href} className="card hover:border-primary">
            <h3 className="font-semibold text-white">{t.title}</h3>
            <p className="mt-2 text-sm text-gray-400">{t.body}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
