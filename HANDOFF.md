# AppForge — Progress & Handoff

_Working branch: `claude/wonderful-fermi-ljkp56` (ships to `main` via PRs; Vercel auto-deploys `main`)._

## ✅ Live and working (www.tryappforge.net)

- **Deployed** on Vercel at the custom domain; **email + password login** (+ magic-link fallback) and an **Account** page to set/change password.
- **Owner account** (jameschambersmail@gmail.com) is **Pro / unlimited** (`profiles.plan = 'pro'`).
- **Research/planning tools**, all with saved history/persistence (Supabase + localStorage fallback):
  - Top 100 Apps (50-per-click, "Generate next 50"), Market Analysis history, Viability Scorer history, Tech Stack history, Projects kanban, Store Listings.
- **Opportunities** finder — AI-recommended apps to build, scored on market fit + competition.
- **App Types** — curated archetype grid (Habit Tracker, Health & Fitness, Hobby Guide, Professional Reference Tool, +12 more). Pick one → scored idea variations of that type (Save + Build this) + "Plan from scratch".
- **Save ☆ / Saved page** — bookmark apps & ideas from Top Apps and Opportunities/App Types to revisit.
- **Build coach** — conversational planning; entry points: "Build a better version" (Top Apps), "Build this" (Opportunities/App Types).
- **Phase 2 — ⚙ Generate app code** (WORKS): from a Build plan, generates a runnable **Expo (React Native + TS)** scaffold file-by-file, viewable in-app + **Download .zip**. Verified live: generated "CoupleStreak" (8 files, valid package.json).

### Marketing Suite (Russell Brunson track — see `MARKETING_SUITE_ROADMAP.md`)
- **Wk 1 — Brain** (`/dashboard/brain`, `brain_facts` table): shared business-context facts every marketing tool reads via `formatBrainContext()`.
- **Wk 2 — Chief of Staff** (`/dashboard/staff`, `staff_sessions` table): account-wide (not per-project) AI partner grounded in the Brain; saved conversation threads. `/api/ai/staff` injects the Brain context into the system prompt.
- **Wk 3 — Attractive Character** (`/dashboard/character`, `characters` table): reusable brand-voice profiles (identity, backstory, voice, audience, signature phrases, avoid). "✨ Draft from my Brain" (`/api/ai/character`) auto-fills from business context. `formatCharacterVoice()` is the helper the coming content tools use to write in-voice.
- Next up: **Wk 4 — One-to-Many Emails** (pick a sequence type → full sequence, grounded in Brain + chosen character).

## Supabase tables (all created in the live project)
`profiles`, `generations`, `projects`, `listings`, `market_analyses`, `viability_scores`, `tech_stacks`, `build_sessions`, `saved_items`, `brain_facts`, `staff_sessions`, `characters`. All with RLS. Full schema in `supabase/schema.sql`. (Re-running the whole schema errors on `create policy` — harmless; tables already exist.)
> **Migration to run for this change:** the `characters` table block in `supabase/schema.sql` (safe to run alone; uses `create table if not exists`).
> Phase 2 (code gen) added NO new tables.

## 🎯 End goal
Idea → a real app **published to the Apple App Store + Google Play**, as hands-off (zero-code) as possible.

## 🔜 Next: Phase 3 — compile & publish (BLOCKED on accounts)
Plan → generate code is DONE. Phase 3 turns the generated Expo code into installable apps and submits them, via a cloud build service (**Expo EAS**). Requires the user's:
- **Apple Developer Program** ($99/yr) — needs a **DUNS number** for an org account. **STATUS: user is waiting on the DUNS number** (as of this session).
- **Google Play Developer** ($25 one-time).
- **Expo (EAS)** account + token for cloud builds.

When resuming Phase 3: scope it first (it's a big build). Likely shape: store the generated app (currently zip-only, not persisted) → trigger EAS builds (needs EAS token; secrets stay server-side) → poll build status → provide install/submit links. Apple/Google review is human and unavoidable. Consider persisting generated apps (a `generated_apps` table) so builds can reference them.

## Optional polish (anytime)
- Richer/higher-quality code generation (more screens/features; quality vs Vercel timeout tradeoff — currently blueprint=Sonnet, files=Haiku in fast batches).
- "Saved only" filter directly on Top Apps / Opportunities lists.
- Stripe billing (so others can subscribe to Pro): needs Stripe account + `STRIPE_*` env vars + `SUPABASE_SERVICE_ROLE_KEY` for the webhook.
- Google sign-in; custom SMTP for production email; dedicated `is_admin` flag.

## ⭐ Product vision / inspiration — Russell Brunson's "MarketingSecrets AI"
The user wants AppForge to grow toward a suite like **MarketingSecrets.ai** (Russell Brunson). Use this as a north-star reference as we build "our version." What it has (seen 2026, marketingsecrets.ai/home/.../software):

- **Your Chief of Staff** — a central AI assistant that ties everything together.
- **Brain** — a central knowledge base about the user + their business (add facts, review what it knows, connect outside AI tools so every app starts with the SAME shared context). This shared-context "Brain" is the architectural centerpiece — all tools read from it.
- **Attractive Character** — build attractive characters with multiple voice styles; train a coaching chatbot; reused across the writing apps.
- **CREATE & BROADCAST** suite ("tools that create content and reach more people"), built on Russell Brunson's frameworks:
  - **One-to-Many Presentations** — full webinar/VSL/challenge/sales-presentation scripts (Perfect Webinar framework).
  - **One-to-Many Emails** — complete email sequences (Soap Opera, Seinfeld, welcome, follow-up, promo).
  - **One-to-Many Social** — full content calendar: scripts, captions, hooks, posts for YouTube/IG/FB/TikTok from one input.
  - **One-to-Many Ads** — high-converting ad copy at scale (headlines, hooks, body, creative concepts) per platform/funnel stage.
  - **Framework Extractor** — interviews the user to name + design their signature framework to teach/sell.
- Left nav also: Sprints, Software, Training & Courses, Community, Promoter, New Task, Projects, Tasks.

**Key pattern to emulate:** a central **Brain (shared business context)** + a **Chief-of-Staff assistant** + a grid of focused **"one-to-many" generators**, each grounded in proven frameworks. AppForge already mirrors this shape loosely (a dashboard of AI tools); the big missing piece is the **shared "Brain"/context layer** every tool draws from, and a marketing/content-generation suite. Revisit how/whether to fold a marketing suite into AppForge vs a sibling product when the user is ready.

## Unrelated note
The **ready-room / `Pastorai1/Sales-pilot`** build failure seen earlier is a SEPARATE project (incomplete "batch 1/2" scaffold). Not AppForge. Being handled in its own session; this repo's tooling can't access it.

## Reference (no secrets here)
- Supabase: ref `taxwodafytenxzyekfcd` → `https://taxwodafytenxzyekfcd.supabase.co`; publishable key `sb_publishable_J2eZVS-jiXSrRkx7GCUwuA_sg0J5ODs`.
- Secrets (Anthropic, Supabase secret, future Stripe/EAS) live only in Vercel env vars / gitignored `.env.local`.
- Vercel project `app-forge` (Hobby; ~25-30s function limit — why Top Apps / Opportunities / code-gen all use small fast batches).
