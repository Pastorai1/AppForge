# Marketing Suite Roadmap — "Our version of MarketingSecrets AI"

North-star reference: **Russell Brunson's MarketingSecrets.ai**. Goal: build our own version of this suite of AI tools for our own use. This file is the durable backlog + weekly plan — advance through it one milestone at a time.

> **Open decision:** does this live *inside* AppForge (new sections) or as a *sibling* product sharing the same login/Brain? Decide before Week 1. (Leaning: sibling product, or a new top-level area in the same app, sharing auth + the Brain.)

---

## Full tool inventory (from marketingsecrets.ai)

### Foundation (the shared core — build these first; everything depends on them)
- **Brain** — central knowledge base about the user + their business. Add facts, review what it knows, connect outside tools so **every** app starts from the same shared context. _This is the architectural centerpiece — all tools read/write here._
- **Your Chief of Staff** — central AI assistant that ties everything together, knows the Brain, and can route to the tools / kick off tasks.
- **Attractive Character** — build attractive characters with multiple voice styles; train a coaching chatbot; reused by the writing apps for on-brand voice.

### CREATE & BROADCAST ("tools that create content and reach more people")
- **One-to-Many Presentations** — full webinar / VSL / challenge / sales-presentation scripts from scratch (built on the Perfect Webinar framework). Input: offer, audience, story.
- **One-to-Many Emails** — complete email sequences (welcome, follow-up, promo, Soap Opera, Seinfeld) — copy/paste ready.
- **One-to-Many Social** — full content calendar from one input: scripts, captions, hooks, posts for YouTube, Instagram, Facebook, TikTok, etc.
- **One-to-Many Ads** — high-converting ad copy at scale: headlines, hooks, body copy, creative concepts, per platform and funnel stage.
- **Framework Extractor** — interviews the user on how they think/work/win, names their signature framework step by step, and designs how to teach it (turn expertise into a teachable/sellable framework).

### SIDE HUSTLE / AGENCY ("tools that diagnose, score, and improve what you already have")
- **Dream 100 (Influencer Secrets)** — find the influencers / affiliates / partners most likely to promote an offer, ranked by audience size, engagement, and relevance; manage every outreach conversation in one CRM.
- **RevScan AI** — scan any business's funnels, website, and social presence in seconds; surface the exact revenue opportunities they're leaving on the table; deliver a ready-to-present report (walk in, show the gap, close the client).
- **FunnelScan AI** _(Coming Soon on theirs)_ — drop any funnel URL → instant AI audit: conversion leaks, missing steps, copy gaps, offer misalignment, prioritized fix list.
- **More coming soon** — leave room for additions.

### Platform / surrounding (lower priority, add as needed)
Left-nav areas: **Sprints**, **Software**, **Training & Courses**, **Community**, **Promoter**, **Projects**, **Tasks/New Task**.

---

## Build sequence (dependency-ordered weekly milestones)

Each milestone ≈ one focused work session ("week"). Pace is flexible. Status: ⬜ todo · 🔄 in progress · ✅ done.

**Phase A — Foundation**
- ⬜ **Wk 1 — Brain (v1):** schema + UI to add/review business facts (about you, offer, audience, voice, products). Tables + RLS, like our other features. Every later tool reads this context.
- ⬜ **Wk 2 — Chief of Staff (v1):** a conversational assistant (like the Build coach) grounded in the Brain; can answer, plan, and point you to the right tool.
- ⬜ **Wk 3 — Attractive Character:** create 1+ voice profiles (tone, story, style) stored in the Brain; later tools accept a "voice" to write in.

**Phase B — Create & Broadcast (each reads Brain + chosen voice; reuse our fast-batch + history patterns)**
- ⬜ **Wk 4 — One-to-Many Emails:** pick a sequence type → generate the full sequence; save to history.
- ⬜ **Wk 5 — One-to-Many Social:** one input → multi-platform content calendar (posts/hooks/captions); save/export.
- ⬜ **Wk 6 — One-to-Many Ads:** generate headlines/hooks/body/creative per platform + funnel stage.
- ⬜ **Wk 7 — One-to-Many Presentations:** Perfect Webinar-structured script from offer/audience/story.
- ⬜ **Wk 8 — Framework Extractor:** interview flow → names + structures the user's signature framework.

**Phase C — Side Hustle / Agency**
- ⬜ **Wk 9 — FunnelScan AI:** funnel URL → AI audit + prioritized fix list. (Web-fetch the page; analyze.)
- ⬜ **Wk 10 — RevScan AI:** business URL/socials → revenue-opportunity report, ready to present.
- ⬜ **Wk 11 — Dream 100:** influencer/partner finder + a simple outreach CRM (list, status, notes).

**Phase D — Platform polish (as needed)**
- ⬜ **Wk 12+ —** Sprints/Tasks/Projects glue, Training/Community/Promoter, plus "more coming soon" ideas.

---

## How we run the weekly cadence
Each session you return, say **"what's this week's marketing-suite step?"** and we:
1. Read this file, find the first non-done milestone.
2. I lay out concrete steps for it, we build it (PR → merge → deploy), and mark it ✅.
3. Adjust order/scope as priorities change.

(Optional: we can also try an automated weekly reminder, but this roadmap + your check-in is the reliable mechanism since the build environment resets between sessions.)

---

## Build readiness assessment (can we build each now?)
Confidence to ship a functional **v1** from screenshot descriptions + known public frameworks. ✅ = ready to build now · ⚠️ = buildable now but quality/fidelity is gated by an external data source or the user's materials.

| Tool | Ready? | Honest caveat / what would level it up |
|---|---|---|
| Brain | ✅ | Pure build. Just decide what context categories to capture (business, offer, audience, voice, products, competitors). |
| Chief of Staff | ✅ | Same pattern as the Build coach, grounded in the Brain. |
| Attractive Character | ✅ | Know the framework (backstory, flaws, polarity, identity). |
| One-to-Many Emails | ✅ | Know Soap Opera (5-email) + Seinfeld structures well. |
| One-to-Many Social | ✅ | Content-calendar generator. |
| One-to-Many Ads | ✅ | Hooks/headlines/body/creative generator. |
| One-to-Many Presentations | ✅ | Perfect Webinar structure is well-documented; user's exact/updated framework materials would sharpen it (optional). |
| Framework Extractor | ✅ | Interview → structure flow. |
| FunnelScan AI | ⚠️ | Needs to **fetch the live funnel URL**. Works on fetchable HTML/text; JS-heavy or bot-blocked pages return little — v1 should let the user paste page content as a fallback. |
| RevScan AI | ⚠️ | Like FunnelScan but across website + socials. Full "scan social in seconds" needs social-data APIs; v1 analyzes a fetched site + user-provided info. |
| Dream 100 | ⚠️ | The hard one: accurate ranking by **real** audience size + engagement needs an influencer/social data source (API). Without it, results are AI-estimated (plausible, not live-accurate — same caveat as our Top Apps). The outreach **CRM** half is a pure build. |

**Three things (optional) that would raise quality across the board:**
1. **The user's business context** — offer, audience, voice, products. Not needed to *build* the tools (the **Brain** collects it at runtime), but it makes every tool's output dramatically better. → Reason to build the Brain first.
2. **Russell's specific framework materials** (if the user has them) — exact Perfect Webinar / sequence templates push output from "good generic" to "faithful."
3. **Data-source decisions** for FunnelScan / RevScan / Dream 100 — pick web-fetch-only v1 now, add a paid data API later for live accuracy.

**Bottom line:** nothing is blocked. We can build a working v1 of all 11. The ✅ tools are fully ready; the ⚠️ three are buildable now with an honest "AI-estimated / fetch-limited" caveat until we wire a real data source.

## Notes
- Reuse everything we already built: Supabase + RLS + localStorage-fallback stores, the fast-batch generation pattern (avoids Vercel timeouts), saved-history pattern, the dashboard/sidebar shell, auth.
- This is separate from the **AppForge app-building** track (Top Apps, Build coach, code generation, Phase 3 store publishing). Both can progress; don't conflate them.
