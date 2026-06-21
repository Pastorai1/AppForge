# AppForge — Progress & Handoff

_Working branch: `claude/wonderful-fermi-ljkp56` (ships to `main` via PRs; Vercel auto-deploys `main`)._

## ✅ Live and working (tryappforge.net)

- **Deployed** on Vercel at the custom domain **www.tryappforge.net** (Supabase + Anthropic wired; new `sb_publishable_`/`sb_secret_` keys).
- **Auth:** email + password (primary) with magic-link fallback; **Account** page to set/change password.
- **Owner account** (jameschambersmail@gmail.com) is **Pro / unlimited** generations (set via `profiles.plan = 'pro'`).
- **All 6 tools** working, with saved **history/persistence** (Supabase + localStorage fallback):
  - Projects (kanban), Store Listings, Market Analysis history, Viability Scorer history, Tech Stack history.
- **Top Apps explorer:** loads **50 per click** in fast 25-item sub-batches (avoids Vercel timeouts), with a **"Generate next 50"** button, **uncapped** (stops when the model runs out of distinct real apps). Uses `claude-haiku-4-5` for speed.
- **Build coach (Phase 1):** conversational AI builder at `/dashboard/build`. Every **Top Apps** card has **"Build a better version →"** that seeds a build session. Sessions saved in `build_sessions`. Coaches a non-technical founder from idea → plan → launch roadmap. Uses Opus 4.8.

## Supabase tables (all created in the live project)
`profiles`, `generations`, `projects`, `listings`, `market_analyses`, `viability_scores`, `tech_stacks`, `build_sessions` — all with RLS. Full schema in `supabase/schema.sql`.
> Note: re-running the whole schema errors on `create policy` (not idempotent) — harmless; the tables already exist.

## 🎯 End goal
AppForge should take a user from idea → a real app **published to the Apple App Store and Google Play**, as hands-off (zero-code) as possible, including **actually building the app**.

## 🔜 Next step — Phase 2: generate the real app code
The planning layer is done. Next is turning a completed Build-coach plan into an actual app:
- **Phase 2 (next):** from a finished build plan, generate a real **Expo / React Native** codebase (one codebase → iOS + Android), viewable/downloadable in-app. This is the "actually build it" piece.
- **Phase 3:** compile to installable apps via a cloud build (e.g., Expo EAS) — requires the user's **Apple Developer ($99/yr)** + **Google Play ($25)** accounts and API tokens.
- **Phase 4:** submit + store review (we already generate the store listing).

When resuming: scope Phase 2 first (it's a bigger build — plan before coding). Consider where generated code is stored (e.g., a `generated_apps` table or per-build artifacts) and how the zero-code user receives it (download zip, or push to a GitHub repo we create).

## Other open items (optional)
- **Stripe billing** — so other users can subscribe to Pro; needs a Stripe account + keys (`STRIPE_*`, plus `SUPABASE_SERVICE_ROLE_KEY` for the webhook).
- **Google sign-in** (optional) — configure Google provider in Supabase.
- **Production email** — Supabase built-in email is rate-limited; add custom SMTP for real volume.
- Optional: dedicated `is_admin` flag (currently using Pro plan for unlimited).

## Reference (no secrets here)
- Supabase project ref: `taxwodafytenxzyekfcd` → `https://taxwodafytenxzyekfcd.supabase.co`
- Publishable key (public/safe): `sb_publishable_J2eZVS-jiXSrRkx7GCUwuA_sg0J5ODs`
- Secrets (Anthropic `sk-ant-…`, Supabase secret, future Stripe) live only in Vercel env vars / gitignored `.env.local`.
- Vercel project: `app-forge` (Hobby plan; function time limit is why Top Apps uses small batches).
