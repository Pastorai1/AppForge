# AppForge

An AI-powered mobile app development platform for indie founders. Research the
market, score ideas, generate store listings, and pick the right tech stack —
all powered by Claude.

Built with **Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase ·
Stripe · Anthropic SDK**.

## Features

1. **Top 100 Apps Explorer** — AI-ranked top-grossing apps with category &
   monetization filters and click-through deep-dive analysis.
2. **Market Analysis** — pick a category, get market size, growth, competition,
   and ranked niches.
3. **Viability Scorer** — a 7-step intake scores an idea across market,
   monetization, competitive edge, and build feasibility.
4. **Projects Kanban** — drag ideas through Scoping → Building → Review → Live.
5. **Store Listing Generator** — App Store + Play Store copy with live character
   counters, per-field AI rewrites, and copy buttons.
6. **Tech Stack Recommender** — answer 5 questions, get a stack, alternatives,
   and a roadmap.

## Architecture

- **All Anthropic calls run server-side** in `app/api/ai/**` route handlers. The
  API key never reaches the browser — `lib/anthropic.ts` imports `server-only`.
- **Supabase** handles auth (email magic link + Google OAuth) and stores
  profiles, generation counts, projects, and listings.
- **Stripe** powers the freemium model: Free = 5 AI generations/month,
  Pro ($9/mo) = unlimited. The webhook updates the user's plan.
- **Graceful demo mode**: with no credentials configured, every page still
  renders. AI/auth/billing calls return friendly "not configured" responses
  instead of crashing, so you can explore the UI before wiring up services.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in your keys
npm run dev
```

Open http://localhost:3000. Without keys you land in **demo mode** — explore the
UI, then add credentials to `.env.local` to turn on AI, auth, and billing.

## Environment variables

See `.env.example`. AppForge is designed to use its **own isolated** Supabase
project, Stripe account, and Anthropic key — keep these separate from any other
app you run.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only; used by the Stripe webhook |
| `ANTHROPIC_API_KEY` | Server-only; AI generation |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `STRIPE_PRO_PRICE_ID` | Billing |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Browser Stripe (optional) |
| `NEXT_PUBLIC_APP_URL` | Base URL for Stripe redirects |

## Database setup

Run `supabase/schema.sql` in your Supabase project's SQL editor. It creates:

- `profiles` (plan + Stripe IDs, auto-created on signup via trigger)
- `generations` (one row per AI call, for freemium metering)
- `projects` and `listings`

Row-level security is enabled on every table.

## Stripe setup

1. Create a recurring **$9/mo** price and put its ID in `STRIPE_PRO_PRICE_ID`.
2. Add a webhook endpoint pointing at `/api/stripe/webhook` and subscribe to
   `checkout.session.completed` and `customer.subscription.deleted`.
3. Put the signing secret in `STRIPE_WEBHOOK_SECRET`.

## Notes

- The model is set in `lib/anthropic.ts` (`claude-opus-4-8`). Change it there.
- The Projects board persists to `localStorage` so it works without a database.
  Swap `lib/projects-store.ts` for Supabase calls to sync across devices.
