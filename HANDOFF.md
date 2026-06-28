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

## Supabase tables (all created in the live project)
`profiles`, `generations`, `projects`, `listings`, `market_analyses`, `viability_scores`, `tech_stacks`, `build_sessions`, `saved_items`. All with RLS. Full schema in `supabase/schema.sql`. (Re-running the whole schema errors on `create policy` — harmless; tables already exist.)
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

## Unrelated note
The **ready-room / `Pastorai1/Sales-pilot`** build failure seen earlier is a SEPARATE project (incomplete "batch 1/2" scaffold). Not AppForge. Being handled in its own session; this repo's tooling can't access it.

## Reference (no secrets here)
- Supabase: ref `taxwodafytenxzyekfcd` → `https://taxwodafytenxzyekfcd.supabase.co`; publishable key `sb_publishable_J2eZVS-jiXSrRkx7GCUwuA_sg0J5ODs`.
- Secrets (Anthropic, Supabase secret, future Stripe/EAS) live only in Vercel env vars / gitignored `.env.local`.
- Vercel project `app-forge` (Hobby; ~25-30s function limit — why Top Apps / Opportunities / code-gen all use small fast batches).
