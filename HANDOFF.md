# AppForge — Progress & Handoff

_Last updated: 2026-06-20. Working branch: `claude/wonderful-fermi-ljkp56` (merged to `main` via PR #2)._

This note captures exactly where we are so we can pick up cleanly next session.

## ✅ Done

- **App is code-complete** for the core product (6 features) and builds clean (`tsc`, `lint`, `next build` all pass).
- **Supabase persistence wired** for Projects and Store Listings (with localStorage fallback in demo mode). Profiles, generations metering, and billing tables already existed.
- **Supabase libraries upgraded** (`@supabase/ssr` 0.12, `@supabase/supabase-js` 2.108) to support the new `sb_publishable_` / `sb_secret_` API key format.
- **Database schema applied** — `supabase/schema.sql` was run successfully in the Supabase SQL Editor (tables: profiles, generations, projects, listings + RLS + auto-profile trigger).
- **Deployed to Vercel** from `main`. Live at **https://app-forge-one.vercel.app** (landing page renders correctly).
- **Vercel env vars set** (Production + Preview): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable key), `ANTHROPIC_API_KEY` (real `sk-ant-…` key).
- **GitHub default branch** changed to `main`.

## 🔜 Resume here — finish the custom domain + login

We were mid-way through attaching the custom domain **tryappforge.net** (bought at GoDaddy).
Canonical will be **www.tryappforge.net** (apex → www redirect was enabled in Vercel).

1. **Vercel → Settings → Domains:** finish adding `tryappforge.net` (apex→www redirect on). Vercel will show DNS records to add.
2. **GoDaddy → Domain → DNS → Manage DNS:** add the records Vercel specifies. Typical Vercel values (confirm against what Vercel actually shows):
   - Apex `@`: **A record → 76.76.21.21**
   - `www`: **CNAME → cname.vercel-dns.com**
   - Remove any conflicting GoDaddy "parked" A/CNAME records for `@` and `www`.
3. Wait for Vercel to show **Valid Configuration** (DNS can take minutes–hours; HTTPS cert auto-issues).
4. **Supabase → Authentication → URL Configuration:**
   - **Site URL:** `https://www.tryappforge.net`
   - **Redirect URLs (add all):**
     - `https://www.tryappforge.net/auth/callback`
     - `https://tryappforge.net/auth/callback`
     - `https://app-forge-one.vercel.app/auth/callback` (keep for fallback testing)
5. **Vercel → Settings → Environment Variables:** set `NEXT_PUBLIC_APP_URL=https://www.tryappforge.net`, then **redeploy** (needed for Stripe redirect URLs later; safe to set now).
6. **Test:** visit the site → Sign in → magic link to jameschambersmail@gmail.com → confirm it lands in the dashboard. Then create a project, refresh, confirm it persists (proves live DB writes work). Generate + save a store listing too.

> Quick alternative if you want to verify login _before_ DNS propagates: set Supabase **Site URL** to `https://app-forge-one.vercel.app` and test on the vercel.app URL first, then switch Site URL to the custom domain once DNS is live.

## 📋 Still outstanding (future sessions)

- **Stripe billing** — Pro plan ($9/mo) checkout + webhook. Needs a Stripe account/product, then env vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, plus `SUPABASE_SERVICE_ROLE_KEY` (the Supabase **secret** key) for the webhook's privileged writes.
- **Google sign-in** (optional) — configure the Google provider in Supabase if wanted; email magic-link works without it.
- **Production email** (optional) — Supabase's built-in email is rate-limited; add custom SMTP for real volume.

## 🔑 Reference (no secrets stored here)

- Supabase project ref: `taxwodafytenxzyekfcd` → URL `https://taxwodafytenxzyekfcd.supabase.co`
- Publishable key (safe/public): `sb_publishable_J2eZVS-jiXSrRkx7GCUwuA_sg0J5ODs`
- Secret keys (Anthropic `sk-ant-…`, Supabase `sb_secret_…`, Stripe) live only in Vercel env vars / the gitignored `.env.local` — never committed.
