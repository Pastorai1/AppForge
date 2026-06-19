import Link from "next/link";
import { Logo } from "@/components/Logo";

const FEATURES = [
  {
    title: "Top 100 Apps Explorer",
    body: "AI-ranked top-grossing apps with category and monetization filters, plus click-through deep dives.",
  },
  {
    title: "Market Analysis",
    body: "Pick a category and get market size, growth, competition, and ranked niches in seconds.",
  },
  {
    title: "Viability Scorer",
    body: "A 7-step intake scores your idea across market, monetization, edge, and build feasibility.",
  },
  {
    title: "Projects Kanban",
    body: "Track ideas from Scoping → Building → Review → Live on a drag-and-drop board.",
  },
  {
    title: "Store Listing Generator",
    body: "App Store + Play Store copy with live character counters and per-field rewrites.",
  },
  {
    title: "Tech Stack Recommender",
    body: "Answer 5 questions and get a recommended stack, alternatives, and a roadmap.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <nav className="flex items-center gap-3">
          <Link href="/login" className="btn-ghost">
            Sign in
          </Link>
          <Link href="/dashboard" className="btn-primary">
            Launch app
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-4xl px-6 pb-16 pt-16 text-center">
        <span className="chip border-primary/60 text-primary">
          AI-powered app studio
        </span>
        <h1 className="mt-6 text-4xl font-bold leading-tight text-white sm:text-6xl">
          Forge your next app
          <br />
          from idea to launch.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400">
          AppForge helps indie founders research the market, score ideas,
          generate store listings, and pick the right stack — all powered by AI.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/dashboard" className="btn-primary px-6 py-3 text-base">
            Get started free
          </Link>
          <Link href="/login" className="btn-ghost px-6 py-3 text-base">
            Sign in
          </Link>
        </div>
        <p className="mt-4 text-sm text-gray-500">
          Free tier includes 5 AI generations / month. Pro is $9/mo for
          unlimited.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card">
              <h3 className="font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm text-gray-400">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-gray-500">
          © {new Date().getFullYear()} AppForge.
        </div>
      </footer>
    </main>
  );
}
