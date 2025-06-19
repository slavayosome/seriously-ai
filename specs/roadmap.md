# Product Roadmap Document: Seriously AI

---

## Timeline Overview

### Phase Definitions

| Phase | Purpose | Time-box* |
|-------|---------|-----------|
| **NOW** | MVP build → first paying customer | Week 1 (next 7 days) |
| **NEXT** | Iterate to product–market fit → 50 customers | Weeks 2-8 |
| **LATER** | Growth & scale → 1,000 customers | Week 9+ |

*Assumes ≈ 25 focused hours/week (solo founder aided by AI agents).*

### Success Metrics by Phase

| Phase | Targets |
|-------|---------|
| **NOW** | ≥ 1 paying customer · 50 beta users · prompt → draft < 2 min |
| **NEXT** | ≥ 50 paying customers · WAU ≥ 30% · insight cost < US$0.10 |
| **LATER** | ≥ 1,000 paying customers · 99.5% uptime · multi-source research live |

---

## NOW: MVP Development (Week 1)

### Day-Level Plan & Stories

#### Day 1: Project Foundation ✅
**High-Level Story:** As a developer, I want a monorepo scaffolded so every package shares TS configs and CI, enabling rapid feature work.

**Detailed AI Prompt:**
```
"Create the complete Seriously AI monorepo with pnpm + Turborepo. Structure:
apps/web (Next.js 14 RSC) · apps/workers · packages/database · packages/shared · packages/ai-services · services (Vercel Edge/cron).
Include turbo.json, base tsconfig, ESLint/Prettier, .env.example, Vercel config, and a README outlining local setup and dev commands."
```

#### Day 2 AM: Database & Auth
**High-Level Story:** As a user, I can sign up with magic-link or Google OAuth so my data is isolated and quota enforced.

**Detailed AI Prompt:**
```
"Generate Supabase SQL for tables: users, credit_wallet, insights, research_reports, drafts. Add RLS to scope data to auth.uid(). Provide TypeScript types and seed script. Then scaffold Next.js server components for auth (Google OAuth + OTP) with protected-route middleware."
```

#### Day 2 PM: Billing
**High-Level Story:** As a customer, I can purchase credits via Stripe so I can run pipelines beyond the free tier.

**Detailed AI Prompt:**
```
"Implement Stripe billing with three plans: Starter (free · 50 credits/mo), Plus (US$19 · 500), Pro (US$49 · 1,500). Create webhook handlers for checkout.session.completed, invoice.payment_succeeded/failed, and credit top-up logic. Expose a /api/billing/webhook route and write Supabase triggers to keep credit_wallet.balance in sync."
```

#### Day 3: Queue & Pipeline v1
**High-Level Story:** As a user, I can enter a prompt and receive 5-10 cited insights so I skip manual research.

**Detailed AI Prompt:**
```
"Build a Redis (BullMQ) queue pipeline:discovery that:
1. Accepts {prompt, userId}.
2. Fetches Google News RSS, resolves URLs, extracts full text with @extractus/article-extractor.
3. Calls OpenAI to embed & rank articles.
4. Uses a structured GPT-4o prompt to distill 5–10 key insights with [citation] markers.
5. Persists a research_report + insights and debits 5 credits atomically.
Return job status via WebSocket."
```

#### Day 4: Draft Generator
**High-Level Story:** As a user, I can turn saved insights into platform-ready drafts so I post faster.

**Detailed AI Prompt:**
```
"Create Draft Generator micro-service that receives {insightIds[], templateId, tone} and produces four drafts (LinkedIn and X variants) using OpenAI. Include variables: {hook, body, CTA}. Deduct 1 credit, store versions, and expose a REST endpoint /api/drafts/generate."
```

#### Day 5: Web UI v1
**High-Level Story:** As a user, I can move from prompt → insights → drafts within a single flow.

**Detailed AI Prompt:**
```
"Build three RSC pages with Shadcn/ui:
1. /new: Prompt form with credit balance.
2. /report/[id]: Insight Explorer list with citation badges, save/unsave toggle.
3. /draft/[id]: Rich Draft Editor with template picker, regen button.
Add loading skeletons, optimistic updates, and mobile-first nav."
```

#### Day 6: Deployment & Env
**High-Level Story:** As an operator, I need prod and preview environments so releases are safe.

**Detailed AI Prompt:**
```
"Configure Vercel for monorepo with preview URLs per PR. Set secrets: SUPABASE_URL, SUPABASE_ANON_KEY, OPENAI_KEY, STRIPE_KEY, REDIS_URL. Enable Vercel Analytics, set edge-function regions to sin1 and fra1. Document CI flow in README."
```

#### Day 7: Polish & Launch
**High-Level Story:** As a founder, I want a stable, demo-ready MVP to onboard first customers.

**Detailed AI Prompt:**
```
"Run e2e Cypress tests: sign-up → buy credits (Stripe test) → run pipeline → save insight → generate draft. Add error boundaries, toast notifications, and 404 page. Produce a launch-checklist.md with steps to flip domain DNS and invite beta users."
```

---

## NEXT: Post-MVP Traction (Weeks 2-8)

### Sprint-Level Epics & Prompts

#### Sprint 1 (Weeks 2-3): Pipeline Engine v2
**High-Level Story:** Modularise pipeline so any combination of steps (discover → insights • insights-only • draft-only) can run, cutting compute cost.

**Detailed AI Prompt:**
```
"Refactor pipelines into Atom → Molecule → Cell graph. Provide JSON spec definition (steps, inputs, cost) and an executor that traverses graph, logs token spend, and supports partial runs."
```

#### Sprint 2 (Weeks 4-5): Knowledge Library v2
**High-Level Story:** Enable tagging, vector search, and filters so users find past insights quickly.

**Detailed AI Prompt:**
```
"Add pgvector similarity search match_insights(term, userId) returning highlights. Build RSC page with multi-select tags, date range, and semantic search bar that debounces queries."
```

#### Sprint 3 (Weeks 6-7): Onboarding & Growth Loops
**High-Level Story:** New users reach first insight in < 3 min and share referral link, boosting sign-ups by 20%.

**Detailed AI Prompt:**
```
"Design an onboarding wizard that captures topics & style, then triggers first pipeline automatically. Generate a unique referral code (user.referral) and a share-to-LinkedIn template with UTM parameters."
```

#### Sprint 4 (Week 8): Observability & Cost Guard-rails
**High-Level Story:** Track per-feature cost and error rate to keep profit margin ≥ 70%.

**Detailed AI Prompt:**
```
"Integrate Sentry for edge functions, PostHog for event analytics. Implement a scheduled job that aggregates token spend per user/day, stores in usage_stats, and alerts Slack if daily spend > US$30."
```

---

## LATER: Growth & Scale (Week 9+)

### Development Themes

#### Source Plugins
**High-Level Story:** Users connect extra sources (Reddit, PDFs) so insight variety improves and churn drops.

**Detailed AI Prompt:**
```
"Create plugin SDK: each source implements discover(topic) -> Article[]. Provide starter plugins for Reddit API and PDF upload (using pdf-parse). Document interface and add dynamic pricing per plugin."
```

#### Auto-Scheduler
**High-Level Story:** Users schedule drafts directly to LinkedIn/Twitter, saving 30 min/day.

**Detailed AI Prompt:**
```
"Implement LinkedIn API v2 integration: OAuth flow, post scheduling queue, analytics webhook. Build UI calendar with drag-&-drop. Add retry/back-off logic respecting rate limits."
```

#### Team Workspaces
**High-Level Story:** Small agencies collaborate in shared libraries, unlocking higher ARPU tier.

**Detailed AI Prompt:**
```
"Add workspace_members table with roles. Migrate RLS to workspace scope. Build invite flow, role management UI, and quota pooling (credits per workspace)."
```

#### Infrastructure Scale
**High-Level Story:** Burst traffic handled (top of Hacker News) with < 300ms P95 latency.

**Detailed AI Prompt:**
```
"Plan Fly.io migration for worker fleet: region-based queues, PG replica read pool, and gray/green deploy scripts. Automate snapshot backups and disaster-recovery runbook."
```

---

## Resource Planning

| Phase | Dev hrs | Design hrs | DevOps hrs | Budget cap |
|-------|---------|------------|------------|------------|
| **NOW** | ~20 | ~5 | ~2 | ≤ US$200/mo |
| **NEXT** | ~120 | ~20 | ~12 | ≤ US$500/mo |
| **LATER** | usage-driven | hire contractors | as needed | scale with MRR |

---

## Risk Mitigation

- **AI Spend:** Token ledger + credit wallet from day 1 to prevent overruns
- **Solo Bandwidth:** Aggressive scope cuts, AI pair-programming, weekly release focus
- **API Limits:** Queued jobs, exponential back-off, caching article fetches 24h
- **Competition:** Double-down on citation transparency and atomic architecture for flexibility

---

## Launch Checklist (End of Week 1)

- [ ] Monorepo deployed on Vercel prod domain
- [ ] Supabase schema + RLS in place
- [ ] Google OAuth & magic-link auth working
- [ ] Stripe checkout (& credits) live in test + prod
- [ ] Discovery → Insights pipeline returns cited report
- [ ] Draft generator produces 4 LinkedIn/X posts
- [ ] Dashboard flow (prompt → insight → draft) functional on mobile
- [ ] First beta user invited & Stripe test payment confirmed

---

*This roadmap mirrors the requested example format: every feature is framed as a user-centric story and paired with a concrete, copy-paste AI prompt to accelerate implementation.*