# AppForge — Project Brief

> **Shareable context for AI collaborators (ChatGPT, Claude Code / VS Code, future sessions).** Read this to understand what AppForge is, how it's built, and the conventions to follow so new work fits the existing codebase. Keep it updated as the app grows.

**Live:** https://www.tryappforge.net (Vercel)
**Repo:** Pastorai1/AppForge (GitHub)
**Owner:** James Chambers · **Last updated:** 2026-07-21

---

## 1. What AppForge is
AppForge is an AI-powered platform with **two tracks** that share one login, dashboard, and knowledge base:

1. **App-building track** — take a non-technical founder from an app idea to a plan, a scored opportunity, and generated **Expo (React Native) app code**, aimed at publishing to the Apple App Store and Google Play (zero-code as possible).
2. **Marketing Suite** — our own version of Russell Brunson's MarketingSecrets.ai: a shared **Brain** (business context) feeding a **Chief of Staff** assistant and a set of **one-to-many content generators**, all written in reusable brand voices.

Both tracks run in the same Next.js app under `/dashboard`.

---

## 2. Tech stack
- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS 3**
- **Supabase** — auth (email+password + magic link), Postgres, Row-Level Security; `@supabase/ssr`
- **Anthropic SDK** (`@anthropic-ai/sdk`) — Claude models for all generation
- **Vercel** — hosting (Hobby plan: ~25-30s function timeout — a core design constraint)
- **Stripe** — wired but not the current focus
- Client-side **jszip** for downloading generated app code

Models used (via `lib/anthropic.ts`): `claude-opus-4-8` (default), `claude-sonnet-*`, `claude-haiku-*` — picked per task for speed vs. quality.

---

## 3. Architecture & key patterns (follow these)

**a. Dual-backend stores.** Every feature persists through a `lib/*-store.ts` module that uses **Supabase when configured**, else **localStorage** (demo mode). Gate on `isSupabaseConfigured()` from `lib/env.ts`. New feature → new store that mirrors an existing one (e.g. `lib/email-sequences-store.ts`).

**b. Fast-batch generation (critical).** To stay under Vercel's function timeout, long generations are split into **many small requests**, one unit at a time, with live progress in the UI. Examples: emails generate one email per call; social one platform per call; presentations one section per call; app code one file per call. **Never** generate a whole large document in a single request.

**c. Brain grounding.** The **Brain** (`brain_facts` table) holds the user's business-context facts. Tools call `getBrainFacts()` + `formatBrainContext()` (`lib/brain-store.ts`) and inject the result into the AI system prompt so every tool "knows the business."

**d. Attractive Character voice.** Reusable brand-voice profiles (`characters` table). Content tools call `formatCharacterVoice()` (`lib/characters-store.ts`) and prepend it so output is on-brand. Content generators offer a voice dropdown.

**e. Saved history.** Generators save results to a per-feature history table and list past runs (view/delete). Mirrors `listings` / `market_analyses`.

**f. AI route shape.** AI endpoints live under `app/api/ai/*`, wrap generation in `withQuota()` (metering, `lib/usage.ts`), set `export const maxDuration = 60`, and return `{ data, usage }`. Structured output uses `generateJSON({ system, prompt, maxTokens, schema })`; chat uses `generateChat({ system, messages, maxTokens })`. The client calls them via `callAi()` (`lib/api.ts`).

**g. CRUD route shape.** Data endpoints (`app/api/<thing>/route.ts` + `[id]/route.ts`) check `isSupabaseConfigured()`, `supabase.auth.getUser()`, enforce `user_id`, and return `{ data }`. RLS also enforces ownership at the DB layer. Keep only HTTP-method exports in `route.ts`; put shared helpers in `lib/`.

**h. UI shell.** Pages live in `app/dashboard/<feature>/page.tsx`, use shared `components/ui.tsx` (`PageHeader`, `Spinner`, `ErrorBanner`) and utility classes (`card`, `input`, `chip`, `chip-active`, `btn-primary`, `btn-ghost`, `label`). Add a nav entry in `components/Sidebar.tsx`.

---

## 4. Feature inventory

### App-building track
| Feature | Page | Notes |
|---|---|---|
| Overview | `/dashboard` | Dashboard home |
| Top 100 Apps | `/dashboard/top-apps` | Generates in batches; "Generate next 50", uncapped |
| App Types | `/dashboard/app-types` | Pick an archetype → scored idea variations |
| Opportunities | `/dashboard/opportunities` | AI-scored app ideas by market fit |
| Saved | `/dashboard/saved` | Bookmarked apps/ideas |
| Market Analysis | `/dashboard/market-analysis` | Market sizing + niches, with history |
| Viability Scorer | `/dashboard/viability` | 4-dimension idea score, with history |
| Projects | `/dashboard/projects` | Kanban of tracked ideas |
| Store Listing | `/dashboard/store-listing` | App Store + Play listing copy |
| Tech Stack | `/dashboard/tech-stack` | Stack recommendation, with history |
| Build | `/dashboard/build` | Conversational build coach → **⚙ Generate app code** (Expo scaffold, view + download .zip) |

### Marketing Suite (Russell Brunson track)
| Feature | Page | Notes |
|---|---|---|
| Brain | `/dashboard/brain` | Shared business-context facts; "Paste many" bulk add. Foundation of everything. |
| Chief of Staff | `/dashboard/staff` | Account-wide advisor (CEO/CMO/CSO/PM/Research lens), grounded in Brain; saved threads |
| Attractive Character | `/dashboard/character` | Reusable brand-voice profiles; "✨ Draft from my Brain" |
| One-to-Many Emails | `/dashboard/emails` | Sequence types (Welcome, Soap Opera, Seinfeld, Promo, Re-engagement); voice + Brain |
| One-to-Many Social | `/dashboard/social` | Multi-platform content calendar (LinkedIn/FB/IG/YouTube/TikTok/X) |
| One-to-Many Ads | `/dashboard/ads` | Ad variations per platform × funnel stage |
| One-to-Many Presentations | `/dashboard/presentations` | Full Perfect Webinar script (8 sections) |
| Framework Extractor | `/dashboard/frameworks` | Interview → named, structured signature framework |

### Not yet built (Marketing Suite — diagnostic tools)
- **FunnelScan AI** — funnel URL → audit + prioritized fixes.
- **RevScan AI** — business site/socials → revenue-opportunity report.
- **Dream 100** — influencer/partner finder + outreach CRM.
- ⚠️ These need to **fetch live URLs / social data**; v1s work with web-fetch + user-pasted input. The CRM half of Dream 100 is a pure build.

---

## 5. Data model (Supabase tables, all with RLS `auth.uid() = user_id`)
`profiles`, `generations` (metering), `projects`, `listings`, `market_analyses`, `viability_scores`, `tech_stacks`, `build_sessions`, `saved_items`, `brain_facts`, `staff_sessions`, `characters`, `email_sequences`, `social_calendars`, `ad_sets`, `presentations`, `frameworks`.

Full schema: `supabase/schema.sql`. History-style tables store the result in a `payload jsonb` column. **Every new table ships a `create table if not exists … + RLS policy` block that the owner runs in the Supabase SQL editor** (safe to run alone).

---

## 6. Directory map
```
app/
  dashboard/<feature>/page.tsx   # UI pages (client components)
  api/
    ai/<tool>/route.ts           # AI generation endpoints (withQuota, maxDuration=60)
    <thing>/route.ts + [id]/     # CRUD endpoints (RLS-enforced)
components/                      # Sidebar, ui.tsx, shared cards, GenerateAppPanel
lib/
  anthropic.ts                  # generateJSON / generateChat / generateText, MODEL
  api.ts                        # callAi() client wrapper
  env.ts                        # isSupabaseConfigured() etc.
  usage.ts                      # withQuota() metering
  supabase/                     # server + browser clients
  <feature>-store.ts            # dual-backend stores
  types.ts                      # all domain types
supabase/schema.sql             # full DB schema + RLS
HANDOFF.md                      # living state doc (what's live, tables, next steps)
MARKETING_SUITE_ROADMAP.md      # Russell Brunson tool backlog + weekly plan
```

---

## 7. Hard rules & constraints
- **Secrets never in git.** Anthropic key, Supabase secret key, Stripe keys, etc. live only in Vercel env vars / a gitignored `.env.local`.
- **Fast-batch or bust.** Any generation that could exceed ~20s must be split into small requests (see §3b). Verify timing before shipping.
- **Migrations are manual.** New tables → provide the `create table … + RLS` SQL for the owner to run in Supabase; use `create table if not exists`.
- **RLS on every table**, plus `user_id` filters in API routes.
- **Keep `route.ts` to HTTP handlers only**; shared helpers go in `lib/`.
- **Escape apostrophes in JSX** (`&apos;`) — the linter enforces it.
- **Verify before shipping:** `npx tsc --noEmit`, `npm run lint`, `npm run build` must all pass.

---

## 8. Contribution / follow-along workflow
1. Branch from `main` (this project uses a feature branch per session).
2. Build the feature following the patterns above.
3. Verify: `tsc --noEmit` + `lint` + `build`.
4. Update `HANDOFF.md` and (if a Marketing Suite tool) `MARKETING_SUITE_ROADMAP.md`.
5. Commit, push, open a PR to `main`.
6. If a new table was added, include the migration SQL in the PR/description for the owner to run in Supabase.
7. Owner merges the PR (Vercel auto-deploys) and runs any SQL.

---

## 9. Roadmap snapshot
- **Marketing Suite:** Brain ✅ · Chief of Staff ✅ · Attractive Character ✅ · Emails ✅ · Social ✅ · Ads ✅ · Presentations ✅ · Framework Extractor ✅. **Next:** FunnelScan → RevScan → Dream 100 (data-source-gated).
- **App-building track — Phase 3 (blocked on accounts):** compile the generated Expo code to installable apps via Expo EAS and submit to the stores. Needs the owner's Apple Developer (awaiting DUNS), Google Play, and Expo/EAS accounts.

---

*This is the source-of-truth outline for AppForge. When you add a feature, update the inventory (§4), the data model (§5), and the roadmap (§9).*
